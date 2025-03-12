# from flask import Flask, jsonify, request
# from flask_sqlalchemy import SQLAlchemy

# app = Flask(__name__)

# # Configure the SQLite database URI
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# db = SQLAlchemy(app)

# # Create a simple model for your database
# class Item(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)

# @app.route('/add', methods=['POST'])
# def add_item():
#     name = request.json.get('name')
#     new_item = Item(name=name)
#     db.session.add(new_item)
#     db.session.commit()
#     return jsonify({'message': 'Item added successfully!'}), 201

# @app.route('/items', methods=['GET'])
# def get_items():
#     items = Item.query.all()
#     return jsonify([{'id': item.id, 'name': item.name} for item in items])

# if __name__ == '__main__':
#     app.run(debug=True)

# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import random
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
def get_db_connection():
    conn = sqlite3.connect('wordle.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Create words table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL UNIQUE,
        used INTEGER DEFAULT 0
    )
    ''')
    
    # Create games table to track game history
    conn.execute('''
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        user_id TEXT,
        guesses TEXT NOT NULL,
        won INTEGER DEFAULT 0,
        date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words (id)
    )
    ''')
    
    # Populate words table if empty
    cursor = conn.execute('SELECT COUNT(*) FROM words')
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Load words from file
        with open('words.txt', 'r') as f:
            words = [word.strip().upper() for word in f if len(word.strip()) == 5]
        
        # Insert words
        for word in words:
            conn.execute('INSERT INTO words (word) VALUES (?)', (word,))
    
    conn.commit()
    conn.close()

# Initialize database
@app.before_request
def before_request():
    if not os.path.exists('wordle.db'):
        init_db()
    else:
        # Ensure tables exist
        get_db_connection().close()

# Route to get a random word
@app.route('/api/word', methods=['GET'])
def get_word():
    conn = get_db_connection()
    
    # Get a random word that hasn't been used much
    cursor = conn.execute('''
    SELECT id, word FROM words 
    WHERE used < 3
    ORDER BY RANDOM() LIMIT 1
    ''')
    
    word_data = cursor.fetchone()
    
    if word_data:
        word_id, word = word_data
        
        # Mark word as used
        conn.execute('UPDATE words SET used = used + 1 WHERE id = ?', (word_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'word': word
        })
    else:
        # If all words have been used 3+ times, reset counter for some words
        conn.execute('UPDATE words SET used = 0 WHERE used >= 3 LIMIT 100')
        conn.commit()
        
        # Try again
        cursor = conn.execute('SELECT id, word FROM words ORDER BY RANDOM() LIMIT 1')
        word_data = cursor.fetchone()
        
        if word_data:
            word_id, word = word_data
            return jsonify({
                'success': True,
                'word': word
            })
    
    conn.close()
    return jsonify({
        'success': False,
        'error': 'No word available'
    }), 500

# Route to validate a guess
@app.route('/api/validate', methods=['POST'])
def validate_guess():
    data = request.get_json()
    guess = data.get('guess', '').upper()
    target_word = data.get('target_word', '').upper()
    
    if not guess or not target_word:
        return jsonify({
            'success': False,
            'error': 'Missing guess or target word'
        }), 400
    
    if len(guess) != 5 or len(target_word) != 5:
        return jsonify({
            'success': False,
            'error': 'Guess and target word must be 5 letters'
        }), 400
    
    # Validate if guess is a valid word (in our dictionary)
    conn = get_db_connection()
    cursor = conn.execute('SELECT 1 FROM words WHERE word = ?', (guess,))
    is_valid_word = cursor.fetchone() is not None
    conn.close()
    
    if not is_valid_word:
        return jsonify({
            'success': False,
            'error': 'Not a valid word'
        }), 400
    
    # Calculate letter statuses (correct, present, absent)
    letter_statuses = []
    target_letters = list(target_word)
    
    # First pass: Mark exact matches
    for i, letter in enumerate(guess):
        if letter == target_word[i]:
            letter_statuses.append({
                'letter': letter,
                'status': 'correct'
            })
            # Mark as used in target
            target_letters[i] = None
        else:
            # Placeholder for second pass
            letter_statuses.append({
                'letter': letter,
                'status': None
            })
    
    # Second pass: Mark present and absent
    for i, status in enumerate(letter_statuses):
        if status['status'] is not None:
            continue
        
        letter = status['letter']
        
        # Check if letter exists in target and hasn't been used
        if letter in target_letters:
            # Mark as present
            status['status'] = 'present'
            # Mark as used in target
            target_letters[target_letters.index(letter)] = None
        else:
            # Mark as absent
            status['status'] = 'absent'
    
    return jsonify({
        'success': True,
        'is_correct': guess == target_word,
        'letter_statuses': letter_statuses
    })

# Route to submit a completed game
@app.route('/api/submit_game', methods=['POST'])
def submit_game():
    data = request.get_json()
    word = data.get('word', '').upper()
    guesses = data.get('guesses', [])
    won = data.get('won', False)
    user_id = data.get('user_id', 'anonymous')
    
    if not word or not guesses:
        return jsonify({
            'success': False,
            'error': 'Missing required fields'
        }), 400
    
    conn = get_db_connection()
    
    # Get word_id
    cursor = conn.execute('SELECT id FROM words WHERE word = ?', (word,))
    word_data = cursor.fetchone()
    
    if not word_data:
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Invalid word'
        }), 400
    
    word_id = word_data['id']
    
    # Save game
    conn.execute(
        'INSERT INTO games (word_id, user_id, guesses, won) VALUES (?, ?, ?, ?)',
        (word_id, user_id, json.dumps(guesses), 1 if won else 0)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True
    })

# Route to get game statistics
@app.route('/api/stats', methods=['GET'])
def get_stats():
    user_id = request.args.get('user_id', 'anonymous')
    
    conn = get_db_connection()
    
    # Get overall stats
    cursor = conn.execute('''
    SELECT 
        COUNT(*) as total_games,
        SUM(won) as games_won,
        (SELECT COUNT(DISTINCT word_id) FROM games WHERE user_id = ?) as unique_words_played
    FROM games
    WHERE user_id = ?
    ''', (user_id, user_id))
    
    stats = dict(cursor.fetchone())
    
    # Get win distribution
    cursor = conn.execute('''
    SELECT 
        LENGTH(guesses) - LENGTH(REPLACE(guesses, '","', '')) as guess_count,
        COUNT(*) as games
    FROM games
    WHERE user_id = ? AND won = 1
    GROUP BY guess_count
    ORDER BY guess_count
    ''', (user_id,))
    
    win_distribution = {}
    for row in cursor:
        # The formula gives us commas, so we add 1 to get actual guesses
        guess_count = row['guess_count'] // 5 + 1
        win_distribution[str(guess_count)] = row['games']
    
    # Fill in missing guess counts
    for i in range(1, 7):
        if str(i) not in win_distribution:
            win_distribution[str(i)] = 0
    
    stats['win_distribution'] = win_distribution
    
    # Calculate current streak
    cursor = conn.execute('''
    SELECT won, date_played 
    FROM games 
    WHERE user_id = ? 
    ORDER BY date_played DESC
    ''', (user_id,))
    
    games = cursor.fetchall()
    
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    
    for game in games:
        if game['won'] == 1:
            temp_streak += 1
        else:
            temp_streak = 0
        
        if temp_streak > max_streak:
            max_streak = temp_streak
    
    # Current streak is the consecutive wins until first loss
    for game in games:
        if game['won'] == 1:
            current_streak += 1
        else:
            break
    
    stats['current_streak'] = current_streak
    stats['max_streak'] = max_streak
    
    conn.close()
    
    return jsonify({
        'success': True,
        'stats': stats
    })

# Route to check if a word is valid
@app.route('/api/check_word', methods=['POST'])
def check_word():
    data = request.get_json()
    word = data.get('word', '').upper()
    
    if not word or len(word) != 5:
        return jsonify({
            'success': False,
            'error': 'Invalid word format'
        }), 400
    
    conn = get_db_connection()
    cursor = conn.execute('SELECT 1 FROM words WHERE word = ?', (word,))
    exists = cursor.fetchone() is not None
    conn.close()
    
    return jsonify({
        'success': True,
        'is_valid': exists
    })

if __name__ == '__main__':
    app.run(debug=True)
