import os
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file
from models import db, Student, Room, Expense, Issue, Admin, FeeRecord
from datetime import datetime
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from calendar import month_name
from sqlalchemy import extract
import pandas as pd
from flask_wtf.csrf import CSRFProtect, generate_csrf, CSRFError
from flask_cors import CORS

app = Flask(__name__)
# Enhanced CORS configuration
CORS(app, 
     origins=["http://localhost:3000"], 
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRFToken"],
     expose_headers=["Content-Type", "X-CSRFToken"],
     credentials=True)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hostel.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_SECRET_KEY'] = os.environ.get('WTF_CSRF_SECRET_KEY', 'your_csrf_secret_key')

# Initialize CSRF protection
csrf = CSRFProtect(app)

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'admin_login'

# After initializing db
migrate = Migrate(app, db)

def create_tables():
    db.create_all()
    for i in range(1, 9):
        if not Room.query.filter_by(room_number=i).first():
            room = Room(room_number=i)
            db.session.add(room)
    db.session.commit()
    
@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

# Test route for debugging
@app.route('/test')
def test():
    return jsonify({'message': 'Flask server is running!', 'status': 'success'})

# Simple health check route
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'message': 'Server is running on port 5051'})

# Add this function for file validation
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'xlsx', 'xls'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Add new signup route
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Check if username already exists
        if Admin.query.filter_by(username=data['username']).first():
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
            
        # Check if email already exists
        if Admin.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Create new admin user
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        new_admin = Admin(
            name=data['name'],
            email=data['email'],
            username=data['username'],
            password_hash=hashed_password
        )
        
        db.session.add(new_admin)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Account created successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Add new login route for API
@app.route('/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        admin = Admin.query.filter_by(username=data['username']).first()
        
        if admin and bcrypt.check_password_hash(admin.password_hash, data['password']):
            login_user(admin)
            return jsonify({
                'success': True,
                'user': {
                    'id': admin.id,
                    'name': admin.name,
                    'email': admin.email,
                    'username': admin.username
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add check-auth route
@app.route('/check-auth')
def check_auth():
    print(f"Check-auth route accessed. Current user: {current_user}")  # Debug log
    if current_user.is_authenticated:
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'name': current_user.name,
                'email': current_user.email,
                'username': current_user.username
            }
        })
    return jsonify({'success': False, 'message': 'Not authenticated'}), 401

# Add new API endpoint for dashboard data
@app.route('/api/dashboard')
@login_required
def api_dashboard():
    try:
        # Get current year and month
        current_year = datetime.now().year
        current_month = datetime.now().month

        # Get total number of active students
        total_students = Student.query.filter_by(status='active').count()

        # Get monthly expenses for the last 6 months
        monthly_expenses = []
        monthly_income = []
        months = []
        
        for i in range(5, -1, -1):
            month = current_month - i
            year = current_year
            if month <= 0:
                month += 12
                year -= 1
                
            # Get expenses for the month
            month_expenses = Expense.query.filter(
                db.extract('year', Expense.date) == year,
                db.extract('month', Expense.date) == month
            ).all()
            total_expense = sum(expense.price for expense in month_expenses)
            
            # Get income (fee collections) for the month
            month_income = FeeRecord.query.filter(
                db.extract('year', FeeRecord.date_paid) == year,
                db.extract('month', FeeRecord.date_paid) == month
            ).all()
            total_income = sum(record.amount for record in month_income)
            
            monthly_expenses.append(total_expense)
            monthly_income.append(total_income)
            months.append(month_name[month][:3])  # Short month name

        # Get expense categories for pie chart
        expense_categories = db.session.query(
            Expense.item_name,
            db.func.sum(Expense.price).label('total')
        ).group_by(Expense.item_name).all()
        
        # Calculate total expenses and income for the current month
        current_month_expenses = sum(monthly_expenses[-1:])
        current_month_income = sum(monthly_income[-1:])
        
        # Calculate profit/loss
        profit_loss = current_month_income - current_month_expenses
        
        # Get fee collection status
        fully_paid = Student.query.filter_by(status='active').filter(
            Student.fee_status == 'paid'
        ).count()
        partially_paid = Student.query.filter_by(status='active').filter(
            Student.fee_status == 'partial'
        ).count()
        unpaid = Student.query.filter_by(status='active').filter(
            Student.fee_status == 'unpaid'
        ).count()

        return jsonify({
            'total_students': total_students,
            'monthly_expenses': monthly_expenses,
            'monthly_income': monthly_income,
            'months': months,
            'expense_categories': [{'item_name': cat[0], 'total': float(cat[1])} for cat in expense_categories],
            'current_month_expenses': current_month_expenses,
            'current_month_income': current_month_income,
            'profit_loss': profit_loss,
            'fully_paid': fully_paid,
            'partially_paid': partially_paid,
            'unpaid': unpaid
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students')
@login_required
def api_students():
    try:
        students = Student.query.all()
        students_data = [{
            'id': student.id,
            'name': student.name,
            'fee': student.fee,
            'room_id': student.room_id,
            'status': student.status,
            'picture': student.picture,
            'fee_status': student.fee_status
        } for student in students]
        return jsonify({'students': students_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rooms')
@login_required
def api_rooms():
    try:
        rooms = Room.query.all()
        rooms_data = []
        for room in rooms:
            try:
                room_data = {
                    'id': room.id,
                    'room_number': room.room_number,
                    'capacity': room.capacity,
                    'current_occupancy': len(room.students) if room.students else 0,
                    'students': []
                }
                
                if room.students:
                    for student in room.students:
                        student_data = {
                            'id': student.id,
                            'name': student.name,
                            'picture': student.picture if student.picture else None
                        }
                        room_data['students'].append(student_data)
                
                rooms_data.append(room_data)
            except Exception as room_error:
                print(f"Error processing room {room.id}: {str(room_error)}")
                continue
                
        return jsonify({'rooms': rooms_data})
    except Exception as e:
        print(f"Error in api_rooms: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
# API for expenses
@app.route('/api/expenses', methods=['GET', 'POST', 'DELETE'])
@login_required
def api_expenses():
    try:
        if request.method == 'GET':
            # Get filter parameters (default to current month and year)
            month = request.args.get('month', datetime.now().month, type=int)
            year = request.args.get('year', datetime.now().year, type=int)

            # Get the previous month's data
            prev_month = month - 1 if month > 1 else 12
            prev_year = year if month > 1 else year - 1

            # Query expenses for the current month and year
            expenses_current = Expense.query.filter(
                extract('year', Expense.date) == year,
                extract('month', Expense.date) == month
            ).order_by(Expense.date.desc()).all()

            # Query expenses for the previous month and year
            expenses_previous = Expense.query.filter(
                extract('year', Expense.date) == prev_year,
                extract('month', Expense.date) == prev_month
            ).order_by(Expense.date.desc()).all()

            # Calculate totals for both months
            total_expenses_current = sum(expense.price for expense in expenses_current)
            total_expenses_previous = sum(expense.price for expense in expenses_previous)

            # Get fee collections for current month
            fee_records_current = FeeRecord.query.filter(
                extract('year', FeeRecord.date_paid) == year,
                extract('month', FeeRecord.date_paid) == month
            ).all()
            total_income_current = sum(record.amount for record in fee_records_current)

            # Get fee collections for previous month
            fee_records_previous = FeeRecord.query.filter(
                extract('year', FeeRecord.date_paid) == prev_year,
                extract('month', FeeRecord.date_paid) == prev_month
            ).all()
            total_income_previous = sum(record.amount for record in fee_records_previous)

            # Calculate remaining balance
            remaining_balance_current = total_income_current - total_expenses_current
            remaining_balance_previous = total_income_previous - total_expenses_previous

            return jsonify({
                'expenses_current': [{
                    'id': e.id,
                    'item_name': e.item_name,
                    'price': e.price,
                    'date': e.date.strftime('%Y-%m-%d'),
                    'user_id': e.user_id
                } for e in expenses_current],
                'expenses_previous': [{
                    'id': e.id,
                    'item_name': e.item_name,
                    'price': e.price,
                    'date': e.date.strftime('%Y-%m-%d'),
                    'user_id': e.user_id
                } for e in expenses_previous],
                'total_expenses_current': total_expenses_current,
                'total_expenses_previous': total_expenses_previous,
                'total_income_current': total_income_current,
                'total_income_previous': total_income_previous,
                'remaining_balance_current': remaining_balance_current,
                'remaining_balance_previous': remaining_balance_previous,
                'current_month': month,
                'current_year': year,
                'prev_month': prev_month,
                'prev_year': prev_year
            })

        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['item_name', 'price', 'date']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'success': False,
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400

            try:
                # Validate price is a valid number
                try:
                    price = float(data['price'])
                    if price <= 0:
                        return jsonify({
                            'success': False,
                            'message': 'Price must be greater than 0'
                        }), 400
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Price must be a valid number'
                    }), 400

                # Validate date format
                try:
                    date = datetime.strptime(data['date'], '%Y-%m-%d')
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid date format. Use YYYY-MM-DD'
                    }), 400

                expense = Expense(
                    item_name=data['item_name'],
                    price=price,
                    date=date,
                    user_id=current_user.id
                )
                db.session.add(expense)
                db.session.commit()
                return jsonify({
                    'success': True,
                    'message': 'Expense added successfully!',
                    'expense': {
                        'id': expense.id,
                        'item_name': expense.item_name,
                        'price': expense.price,
                        'date': expense.date.strftime('%Y-%m-%d'),
                        'user_id': expense.user_id
                    }
                })
            except Exception as e:
                db.session.rollback()
                return jsonify({
                    'success': False,
                    'message': f'Error adding expense: {str(e)}'
                }), 400

        elif request.method == 'DELETE':
            expense_id = request.args.get('id', type=int)
            if not expense_id:
                return jsonify({'success': False, 'message': 'No expense ID provided'}), 400

            expense = Expense.query.get_or_404(expense_id)
            db.session.delete(expense)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Expense deleted successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add new route to get CSRF token
@app.route('/api/csrf-token')
def get_csrf_token():
    return jsonify({'csrf_token': generate_csrf()})

# Exempt routes from CSRF protection after they are defined
csrf.exempt(signup)
csrf.exempt(api_login)
csrf.exempt(check_auth)
csrf.exempt(get_csrf_token)

if __name__ == '__main__':  
    with app.app_context():
        create_tables()
    app.run(debug=True,port=5051)
