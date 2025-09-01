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
from models import Employee, SalaryRecord

app = Flask(__name__)
# Enhanced CORS configuration
CORS(app, 
     origins=["http://localhost:3000"], 
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "X-CSRFToken"],
     expose_headers=["Content-Type", "X-CSRF-Token", "X-CSRFToken"],
     credentials=True)



app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hostel.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes
app.config['WTF_CSRF_ENABLED'] = False
app.config['WTF_CSRF_SECRET_KEY'] = os.environ.get('WTF_CSRF_SECRET_KEY', 'your_csrf_secret_key')

# Initialize CSRF protection (disabled for now)
# csrf = CSRFProtect(app)

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'admin_login'

# After initializing db
migrate = Migrate(app, db)

def create_tables():
    db.create_all()
    
    # Create 14 rooms with 3 seats (rooms 1-14)
    for i in range(1, 15):
        if not Room.query.filter_by(room_number=i).first():
            room = Room(room_number=i, capacity=3)
            db.session.add(room)
    
    # Create 4 rooms with 4 seats (rooms 15-18)
    for i in range(15, 19):
        if not Room.query.filter_by(room_number=i).first():
            room = Room(room_number=i, capacity=4)
            db.session.add(room)
    
    # Create initial employees if they don't exist
    if not Employee.query.filter_by(name='M Bilal').first():
        bilal = Employee(name='M Bilal', position='Manager', base_salary=50000)
        db.session.add(bilal)
    
    if not Employee.query.filter_by(name='Ishfaq Hussain').first():
        ishfaq = Employee(name='Ishfaq Hussain', position='Cook', base_salary=30000)
        db.session.add(ishfaq)
    
    if not Employee.query.filter_by(name='Abdul Waheed').first():
        abdul = Employee(name='Abdul Waheed', position='Cook', base_salary=20000)
        db.session.add(abdul)
    
    db.session.commit()
    
@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

# Main route
@app.route('/')
def main():
    return jsonify({'message': 'Hostel Management System API', 'status': 'success'})

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

# Add logout route
@app.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

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

        # Calculate total salaries for current month
        current_month_year = f"{current_year:04d}-{current_month:02d}"
        current_month_salaries = SalaryRecord.query.filter_by(month_year=current_month_year).all()
        total_salaries_current = sum(record.amount_paid for record in current_month_salaries)
        
        # Calculate total salaries for previous month
        prev_month = current_month - 1 if current_month > 1 else 12
        prev_year = current_year if current_month > 1 else current_year - 1
        prev_month_year = f"{prev_year:04d}-{prev_month:02d}"
        prev_month_salaries = SalaryRecord.query.filter_by(month_year=prev_month_year).all()
        total_salaries_previous = sum(record.amount_paid for record in prev_month_salaries)

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
            'unpaid': unpaid,
            'total_salaries_current': total_salaries_current,
            'total_salaries_previous': total_salaries_previous
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students', methods=['GET', 'POST'])
def api_students():
    try:
        if request.method == 'GET':
            students = Student.query.all()
            students_data = [{
                'id': student.id,
                'name': student.name,
                'fee': student.fee,
                'room_id': student.room_id,
                'room_number': student.room_number,
                'status': student.status,
                'picture': student.picture,
                'fee_status': student.fee_status,
                'remaining_fee': student.remaining_fee
            } for student in students]
            return jsonify({'students': students_data})
        elif request.method == 'POST':
            data = request.get_json()
            
            # Validate required fields
            if not data.get('name') or not data.get('fee') or not data.get('room_id'):
                return jsonify({'error': 'Name, fee, and room_id are required'}), 400
            
            # Validate room_id is within valid range
            room_id = int(data['room_id'])
            if room_id < 1 or room_id > 18:
                return jsonify({'error': 'Room ID must be between 1 and 18'}), 400
            
            # Check if room exists
            room = Room.query.get(room_id)
            if not room:
                return jsonify({'error': f'Room {room_id} not found'}), 404
            
            # Check room capacity
            if len(room.students) >= room.capacity:
                return jsonify({'error': f'Room {room_id} is at full capacity ({room.capacity} students)'}), 400
            
            # Create new student
            new_student = Student(
                name=data['name'],
                fee=data['fee'],
                room_id=data['room_id'],
                status='active'
            )
            
            db.session.add(new_student)
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'message': 'Student enrolled successfully',
                'student': {
                    'id': new_student.id,
                    'name': new_student.name,
                    'fee': new_student.fee,
                    'room_id': new_student.room_id,
                    'status': new_student.status
                }
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['PUT', 'DELETE'])
def api_update_student(student_id):
    try:
        student = Student.query.get_or_404(student_id)
        
        if request.method == 'DELETE':
            try:
                # Delete associated fee records first
                fee_records = FeeRecord.query.filter_by(student_id=student_id).all()
                for fee_record in fee_records:
                    db.session.delete(fee_record)
                
                # Delete the student
                db.session.delete(student)
                db.session.commit()
                return jsonify({'success': True, 'message': 'Student deleted successfully'})
            except Exception as e:
                db.session.rollback()
                print(f"Error deleting student: {str(e)}")
                return jsonify({'error': 'Failed to delete student due to database constraints'}), 500
        
        # Handle PUT request for updates
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            student.name = data['name']
        if 'fee' in data:
            student.fee = data['fee']
        if 'room_id' in data:
            # Validate room_id is within valid range
            room_id = int(data['room_id'])
            if room_id < 1 or room_id > 18:
                return jsonify({'error': 'Room ID must be between 1 and 18'}), 400
            
            # Check if new room exists
            new_room = Room.query.get(room_id)
            if not new_room:
                return jsonify({'error': f'Room {room_id} not found'}), 404
            
            # Check room capacity if changing rooms
            if student.room_id != room_id:
                if len(new_room.students) >= new_room.capacity:
                    return jsonify({'error': f'Room {room_id} is at full capacity ({new_room.capacity} students)'}), 400
            
            student.room_id = room_id
        if 'status' in data:
            student.status = data['status']
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student updated successfully'})
        
    except Exception as e:
        db.session.rollback()
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

# Add students route
@app.route('/students')
def get_students():
    try:
        students = Student.query.all()
        return jsonify({'students': [{
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'phone': student.phone,
            'room_number': student.room_number,
            'status': student.status,
            'fee_status': student.fee_status,
            'picture': student.picture,
            'fee': student.fee,
            'remaining_fee': student.remaining_fee
        } for student in students]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add enroll route
@app.route('/enroll', methods=['POST'])
def enroll_student():
    try:
        data = request.get_json()
        new_student = Student(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            room_number=data['room_number'],
            status='active',
            fee_status='unpaid'
        )
        db.session.add(new_student)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student enrolled successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Add collect-fee route
@app.route('/collect-fee', methods=['POST'])
def collect_fee():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('student_id') or not data.get('amount') or not data.get('date'):
            return jsonify({'success': False, 'message': 'Student ID, amount, and date are required'}), 400
        
        # Create fee record
        fee_record = FeeRecord(
            student_id=data['student_id'],
            amount=data['amount'],
            date_paid=datetime.strptime(data['date'], '%Y-%m-%d'),
            month_year=datetime.strptime(data['date'], '%Y-%m-%d').strftime('%Y-%m'),
            payment_method='cash'  # Default to cash
        )
        db.session.add(fee_record)
        
        # Update student fee status based on total paid
        student = Student.query.get(data['student_id'])
        if student:
            # Calculate total paid for current month
            current_month = datetime.strptime(data['date'], '%Y-%m-%d').month
            current_year = datetime.strptime(data['date'], '%Y-%m-%d').year
            
            # Get all fee records for this student in the current month
            month_fee_records = FeeRecord.query.filter(
                FeeRecord.student_id == data['student_id'],
                extract('month', FeeRecord.date_paid) == current_month,
                extract('year', FeeRecord.date_paid) == current_year
            ).all()
            
            total_paid = sum(record.amount for record in month_fee_records)
            
            # Update the database column directly
            if total_paid >= student.fee:
                student.fee_status = 'paid'
            elif total_paid > 0:
                student.fee_status = 'partial'
            else:
                student.fee_status = 'unpaid'
            
            student.last_fee_payment = datetime.strptime(data['date'], '%Y-%m-%d')
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Fee collected successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Add fee-records route
@app.route('/fee-records')
def get_fee_records():
    try:
        records = FeeRecord.query.all()
        return jsonify({'fee_records': [{
            'id': record.id,
            'student_id': record.student_id,
            'amount': record.amount,
            'date_paid': record.date_paid.strftime('%Y-%m-%d'),
            'payment_method': record.payment_method,
            'student': {
                'id': record.student.id,
                'name': record.student.name,
                'fee_status': record.student.fee_status,
                'room_number': record.student.room_number
            }
        } for record in records]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add new API endpoint for fee data with filtering
@app.route('/api/fees')
@login_required
def api_fees():
    try:
        # Get filter parameters (default to current month and year)
        month = request.args.get('month', datetime.now().month, type=int)
        year = request.args.get('year', datetime.now().year, type=int)

        # Get the previous month's data
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1

        # Query fee records for the current month and year
        fee_records_current = FeeRecord.query.filter(
            extract('year', FeeRecord.date_paid) == year,
            extract('month', FeeRecord.date_paid) == month
        ).order_by(FeeRecord.date_paid.desc()).all()

        # Query fee records for the previous month and year
        fee_records_previous = FeeRecord.query.filter(
            extract('year', FeeRecord.date_paid) == prev_year,
            extract('month', FeeRecord.date_paid) == prev_month
        ).order_by(FeeRecord.date_paid.desc()).all()

        # Calculate totals for both months
        total_fees_current = sum(record.amount for record in fee_records_current)
        total_fees_previous = sum(record.amount for record in fee_records_previous)

        # Get monthly totals for the year (for chart)
        monthly_totals = []
        for m in range(1, 13):
            month_total = FeeRecord.query.filter(
                extract('year', FeeRecord.date_paid) == year,
                extract('month', FeeRecord.date_paid) == m
            ).with_entities(db.func.sum(FeeRecord.amount)).scalar() or 0
            monthly_totals.append({
                'month': datetime(2000, m, 1).strftime('%B'),
                'total': month_total
            })

        return jsonify({
            'fee_records_current': [{
                'id': record.id,
                'student_id': record.student_id,
                'amount': record.amount,
                'date_paid': record.date_paid.strftime('%Y-%m-%d'),
                'student': {
                    'id': record.student.id,
                    'name': record.student.name,
                    'fee_status': record.student.fee_status,
                    'room_number': record.student.room_number
                }
            } for record in fee_records_current],
            'fee_records_previous': [{
                'id': record.id,
                'student_id': record.student_id,
                'amount': record.amount,
                'date_paid': record.date_paid.strftime('%Y-%m-%d'),
                'student': {
                    'id': record.student.id,
                    'name': record.student.name,
                    'fee_status': record.student.fee_status,
                    'room_number': record.student.room_number
                }
            } for record in fee_records_previous],
            'total_fees_current': total_fees_current,
            'total_fees_previous': total_fees_previous,
            'current_month': month,
            'current_year': year,
            'prev_month': prev_month,
            'prev_year': prev_year,
            'monthly_totals': monthly_totals
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add update student route
@app.route('/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    try:
        student = Student.query.get_or_404(student_id)
        data = request.get_json()
        
        if 'name' in data:
            student.name = data['name']
        if 'email' in data:
            student.email = data['email']
        if 'phone' in data:
            student.phone = data['phone']
        if 'room_number' in data:
            student.room_number = data['room_number']
        if 'status' in data:
            student.status = data['status']
        if 'fee_status' in data:
            student.fee_status = data['fee_status']
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Add delete student route
@app.route('/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        student = Student.query.get_or_404(student_id)
        
        # Delete associated fee records first
        fee_records = FeeRecord.query.filter_by(student_id=student_id).all()
        for fee_record in fee_records:
            db.session.delete(fee_record)
        
        # Delete the student
        db.session.delete(student)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting student: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Add export PDF route
@app.route('/export_pdf/<int:year>/<int:month>')
def export_pdf(year, month):
    try:
        # Get expenses for the specified month and year
        expenses = Expense.query.filter(
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).all()
        
        # Create PDF
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Title
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, f"Expenses Report - {month_name[month]} {year}")
        
        # Table headers
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 100, "Item")
        p.drawString(200, height - 100, "Price")
        p.drawString(300, height - 100, "Date")
        
        # Table data
        y_position = height - 120
        p.setFont("Helvetica", 10)
        total = 0
        
        for expense in expenses:
            if y_position < 50:  # New page if needed
                p.showPage()
                y_position = height - 50
                p.setFont("Helvetica-Bold", 12)
                p.drawString(50, height - 50, f"Expenses Report - {month_name[month]} {year} (Continued)")
                p.setFont("Helvetica", 10)
                y_position = height - 70
            
            p.drawString(50, y_position, expense.item_name)
            p.drawString(200, y_position, f"Rs.{expense.price:.2f}")
            p.drawString(300, y_position, expense.date.strftime('%Y-%m-%d'))
            total += expense.price
            y_position -= 20
        
        # Total
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_position - 20, f"Total: Rs.{total:.2f}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"expenses_{month_name[month]}_{year}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add new route to get CSRF token
@app.route('/api/csrf-token')
def get_csrf_token():
    return jsonify({'csrf_token': generate_csrf()})

# Employee Management Routes

# Get all employees
@app.route('/api/employees', methods=['GET'])
def get_employees():
    try:
        employees = Employee.query.all()
        employee_list = []
        
        for employee in employees:
            # Get current month and year
            current_month = datetime.now().month
            current_year = datetime.now().year
            month_year = f"{current_year:04d}-{current_month:02d}"
            
            # Check if salary is paid for current month
            salary_paid = SalaryRecord.query.filter_by(
                employee_id=employee.id,
                month_year=month_year
            ).first()
            
            employee_data = {
                'id': employee.id,
                'name': employee.name,
                'position': employee.position,
                'base_salary': employee.base_salary,
                'hire_date': employee.hire_date.strftime('%Y-%m-%d'),
                'status': employee.status,
                'current_month_salary_paid': salary_paid.amount_paid if salary_paid else 0,
                'current_month_salary_status': 'paid' if salary_paid else 'unpaid'
            }
            employee_list.append(employee_data)
        
        return jsonify({'success': True, 'employees': employee_list})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add new employee
@app.route('/api/employees', methods=['POST'])
def add_employee():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['name', 'position', 'base_salary']):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Create new employee
        employee = Employee(
            name=data['name'],
            position=data['position'],
            base_salary=float(data['base_salary'])
        )
        
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Employee added successfully', 'employee_id': employee.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Update employee
@app.route('/api/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    try:
        employee = Employee.query.get_or_404(employee_id)
        data = request.get_json()
        
        if 'name' in data:
            employee.name = data['name']
        if 'position' in data:
            employee.position = data['position']
        if 'base_salary' in data:
            employee.base_salary = float(data['base_salary'])
        if 'status' in data:
            employee.status = data['status']
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Employee updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Delete employee
@app.route('/api/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    try:
        employee = Employee.query.get_or_404(employee_id)
        
        # Delete associated salary records first
        salary_records = SalaryRecord.query.filter_by(employee_id=employee_id).all()
        for salary_record in salary_records:
            db.session.delete(salary_record)
        
        # Delete the employee
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Employee deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Get salary records for an employee
@app.route('/api/employees/<int:employee_id>/salaries', methods=['GET'])
def get_employee_salaries(employee_id):
    try:
        employee = Employee.query.get_or_404(employee_id)
        salary_records = SalaryRecord.query.filter_by(employee_id=employee_id).order_by(SalaryRecord.month_year.desc()).all()
        
        salary_list = []
        for record in salary_records:
            salary_data = {
                'id': record.id,
                'month_year': record.month_year,
                'amount_paid': record.amount_paid,
                'date_paid': record.date_paid.strftime('%Y-%m-%d'),
                'payment_method': record.payment_method,
                'notes': record.notes
            }
            salary_list.append(salary_data)
        
        return jsonify({
            'success': True, 
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'position': employee.position,
                'base_salary': employee.base_salary
            },
            'salary_records': salary_list
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add salary payment record
@app.route('/api/employees/<int:employee_id>/salaries', methods=['POST'])
def add_salary_payment(employee_id):
    try:
        employee = Employee.query.get_or_404(employee_id)
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['month_year', 'amount_paid']):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Check if salary already paid for this month
        existing_payment = SalaryRecord.query.filter_by(
            employee_id=employee_id,
            month_year=data['month_year']
        ).first()
        
        if existing_payment:
            return jsonify({'success': False, 'message': 'Salary already paid for this month'}), 400
        
        # Create salary record
        salary_record = SalaryRecord(
            employee_id=employee_id,
            month_year=data['month_year'],
            amount_paid=float(data['amount_paid']),
            payment_method=data.get('payment_method', 'cash'),
            notes=data.get('notes', '')
        )
        
        db.session.add(salary_record)
        
        # Automatically create an expense record for the salary payment
        # Parse month_year to get date for expense
        year, month = data['month_year'].split('-')
        expense_date = datetime(int(year), int(month), 1)  # First day of the month
        
        # Get current admin user ID from the authenticated session
        admin_user_id = current_user.id
        
        salary_expense = Expense(
            item_name=f"Salary paid to {employee.name} ({employee.position})",
            price=float(data['amount_paid']),
            date=expense_date,
            user_id=admin_user_id
        )
        
        db.session.add(salary_expense)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Salary payment recorded successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Update salary payment record
@app.route('/api/salaries/<int:salary_id>', methods=['PUT'])
def update_salary_payment(salary_id):
    try:
        salary_record = SalaryRecord.query.get_or_404(salary_id)
        data = request.get_json()
        
        if 'amount_paid' in data:
            salary_record.amount_paid = float(data['amount_paid'])
        if 'payment_method' in data:
            salary_record.payment_method = data['payment_method']
        if 'notes' in data:
            salary_record.notes = data['notes']
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Salary payment updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Delete salary payment record
@app.route('/api/salaries/<int:salary_id>', methods=['DELETE'])
def delete_salary_payment(salary_id):
    try:
        salary_record = SalaryRecord.query.get_or_404(salary_id)
        
        # Find and delete the corresponding expense record
        # The expense name format is "Salary paid to {employee.name} ({employee.position})"
        expense_name = f"Salary paid to {salary_record.employee.name} ({salary_record.employee.position})"
        corresponding_expense = Expense.query.filter_by(
            item_name=expense_name,
            price=salary_record.amount_paid,
            user_id=current_user.id
        ).first()
        
        if corresponding_expense:
            db.session.delete(corresponding_expense)
        
        # Delete the salary record
        db.session.delete(salary_record)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Salary payment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Get monthly salary summary
@app.route('/api/salaries/summary/<month_year>', methods=['GET'])
def get_monthly_salary_summary(month_year):
    try:
        # Get all salary records for the specified month
        salary_records = SalaryRecord.query.filter_by(month_year=month_year).all()
        
        total_paid = sum(record.amount_paid for record in salary_records)
        total_employees = Employee.query.filter_by(status='active').count()
        paid_employees = len(salary_records)
        unpaid_employees = total_employees - paid_employees
        
        summary = {
            'month_year': month_year,
            'total_paid': total_paid,
            'total_employees': total_employees,
            'paid_employees': paid_employees,
            'unpaid_employees': unpaid_employees,
            'payments': []
        }
        
        for record in salary_records:
            payment_data = {
                'employee_name': record.employee.name,
                'position': record.employee.position,
                'amount_paid': record.amount_paid,
                'date_paid': record.date_paid.strftime('%Y-%m-%d'),
                'payment_method': record.payment_method
            }
            summary['payments'].append(payment_data)
        
        return jsonify({'success': True, 'summary': summary})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Get salary summary by year
@app.route('/api/salaries/yearly-summary/<int:year>', methods=['GET'])
def get_yearly_salary_summary(year):
    try:
        # Get all salary records for the specified year
        salary_records = SalaryRecord.query.filter(
            SalaryRecord.month_year.like(f"{year}-%")
        ).all()
        
        # Group by month
        monthly_summary = {}
        for i in range(1, 13):
            month_key = f"{year:04d}-{i:02d}"
            monthly_summary[month_key] = {
                'month': month_key,
                'total_paid': 0,
                'employee_count': 0,
                'payments': []
            }
        
        # Calculate monthly totals
        for record in salary_records:
            month_key = record.month_year
            if month_key in monthly_summary:
                monthly_summary[month_key]['total_paid'] += record.amount_paid
                monthly_summary[month_key]['employee_count'] += 1
                monthly_summary[month_key]['payments'].append({
                    'employee_name': record.employee.name,
                    'position': record.employee.position,
                    'amount_paid': record.amount_paid,
                    'date_paid': record.date_paid.strftime('%Y-%m-%d')
                })
        
        # Convert to list and sort by month
        monthly_list = list(monthly_summary.values())
        monthly_list.sort(key=lambda x: x['month'])
        
        # Calculate yearly totals
        yearly_total = sum(month['total_paid'] for month in monthly_list)
        total_employees = Employee.query.filter_by(status='active').count()
        
        summary = {
            'year': year,
            'yearly_total': yearly_total,
            'total_employees': total_employees,
            'monthly_breakdown': monthly_list
        }
        
        return jsonify({'success': True, 'summary': summary})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Get all available month-year combinations for filtering
@app.route('/api/salaries/available-months', methods=['GET'])
def get_available_salary_months():
    try:
        # Get all unique month_year values from salary records
        month_years = db.session.query(SalaryRecord.month_year).distinct().order_by(SalaryRecord.month_year.desc()).all()
        
        # Get all unique years from salary records
        years = db.session.query(
            db.func.substr(SalaryRecord.month_year, 1, 4).label('year')
        ).distinct().order_by(db.func.substr(SalaryRecord.month_year, 1, 4).desc()).all()
        
        available_months = [month[0] for month in month_years]
        available_years = [year[0] for year in years]
        
        return jsonify({
            'success': True,
            'available_months': available_months,
            'available_years': available_years
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Bulk upload students via Excel
@app.route('/api/students/bulk-upload', methods=['POST'])
@login_required
def bulk_upload_students():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({'success': False, 'message': 'Please upload an Excel file (.xlsx or .xls)'}), 400
        
        # Read the Excel file
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error reading Excel file: {str(e)}'}), 400
        
        # Validate required columns
        required_columns = ['name', 'fee', 'room_id']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'success': False, 
                'message': f'Missing required columns: {", ".join(missing_columns)}'
            }), 400
        
        # Process the data
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Validate data
                name = str(row['name']).strip()
                fee = float(row['fee'])
                room_id = int(row['room_id'])
                
                if not name or pd.isna(name):
                    errors.append(f"Row {index + 2}: Name is required")
                    error_count += 1
                    continue
                
                if fee <= 0:
                    errors.append(f"Row {index + 2}: Fee must be greater than 0")
                    error_count += 1
                    continue
                
                if room_id < 1 or room_id > 18:
                    errors.append(f"Row {index + 2}: Room ID must be between 1 and 18")
                    error_count += 1
                    continue
                
                # Check if room exists and has capacity
                room = Room.query.filter_by(room_number=room_id).first()
                if not room:
                    errors.append(f"Row {index + 2}: Room {room_id} does not exist")
                    error_count += 1
                    continue
                
                if room.current_occupancy >= room.capacity:
                    errors.append(f"Row {index + 2}: Room {room_id} is at full capacity")
                    error_count += 1
                    continue
                
                # Check if student name already exists
                existing_student = Student.query.filter_by(name=name).first()
                if existing_student:
                    errors.append(f"Row {index + 2}: Student '{name}' already exists")
                    error_count += 1
                    continue
                
                # Create new student
                student = Student(
                    name=name,
                    fee=fee,
                    room_id=room_id,
                    status='active',
                    fee_status='unpaid'
                )
                
                db.session.add(student)
                success_count += 1
                
            except (ValueError, TypeError) as e:
                errors.append(f"Row {index + 2}: Invalid data format - {str(e)}")
                error_count += 1
                continue
            except Exception as e:
                errors.append(f"Row {index + 2}: Unexpected error - {str(e)}")
                error_count += 1
                continue
        
        # Commit all successful additions
        if success_count > 0:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully added {success_count} students',
            'summary': {
                'total_processed': len(df),
                'success_count': success_count,
                'error_count': error_count,
                'errors': errors[:10]  # Limit errors to first 10
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Bulk upload failed: {str(e)}'}), 500

# Download Excel template for bulk upload
@app.route('/api/students/download-template', methods=['GET'])
@login_required
def download_student_template():
    try:
        # Create sample data
        sample_data = [
            {'name': 'John Doe', 'fee': 5000.00, 'room_id': 1},
            {'name': 'Jane Smith', 'fee': 5000.00, 'room_id': 1},
            {'name': 'Mike Johnson', 'fee': 5000.00, 'room_id': 1},
            {'name': 'Sarah Wilson', 'fee': 6000.00, 'room_id': 15},
            {'name': 'David Brown', 'fee': 6000.00, 'room_id': 15}
        ]
        
        # Create DataFrame
        df = pd.DataFrame(sample_data)
        
        # Create Excel file in memory
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Students', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Students']
            
            # Add instructions sheet
            instructions_data = [
                ['BULK STUDENT UPLOAD INSTRUCTIONS'],
                [''],
                ['REQUIRED COLUMNS:'],
                ['name: Student full name (required)'],
                ['fee: Monthly fee amount in Rs. (required, must be > 0)'],
                ['room_id: Room number 1-18 (required)'],
                [''],
                ['ROOM CAPACITY:'],
                ['Rooms 1-14: Maximum 3 students'],
                ['Rooms 15-18: Maximum 4 students'],
                [''],
                ['VALIDATION RULES:'],
                ['- Student names must be unique'],
                ['- Room must exist and have available capacity'],
                ['- Fee must be a positive number'],
                ['- Room ID must be between 1 and 18'],
                [''],
                ['TIPS:'],
                ['- Remove this instructions sheet before uploading'],
                ['- Ensure all required columns are present'],
                ['- Check room availability before assigning'],
                ['- Use proper data types (text for names, numbers for fee and room_id)']
            ]
            
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Instructions', index=False, header=False)
            
            # Format the main sheet
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='student_bulk_upload_template.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Template generation failed: {str(e)}'}), 500


if __name__ == '__main__':  
    with app.app_context():
        create_tables()
    app.run(debug=True,port=5051)
