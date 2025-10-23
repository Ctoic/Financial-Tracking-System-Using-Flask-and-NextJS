from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
from sqlalchemy.orm import relationship
from sqlalchemy import extract


db = SQLAlchemy()

# FeeRecord Model
class FeeRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date_paid = db.Column(db.Date, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), default='cash')  # cash, card, online, etc.
    month_year = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM for monthly tracking
    student = relationship('Student', back_populates='fee_records')


# Room Model
class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.Integer, unique=True, nullable=False)
    capacity = db.Column(db.Integer, default=4)  # Default capacity of 4 students per room
    students = relationship('Student', back_populates='room')

# Student Model
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    fee = db.Column(db.Float, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    picture = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')  # active, inactive, graduated
    fee_status = db.Column(db.String(20), default='unpaid')  # unpaid, partial, paid
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_fee_payment = db.Column(db.DateTime)
    
    # Relationships
    room = relationship('Room', back_populates='students')
    fee_records = relationship('FeeRecord', back_populates='student')

    def __repr__(self):
        return f'<Student {self.name}>'

    @property
    def room_number(self):
        """Get room number for compatibility"""
        return self.room.room_number if self.room else None

    @property
    def is_fee_paid(self):
        """Check if the student has paid fees for the current month"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        total_paid = sum(record.amount for record in FeeRecord.query.filter(
            FeeRecord.student_id == self.id,
            extract('month', FeeRecord.date_paid) == current_month,
            extract('year', FeeRecord.date_paid) == current_year
        ).all())
        return total_paid >= self.fee

    @property
    def computed_fee_status(self):
        """Get the computed fee payment status for the current month"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        total_paid = sum(record.amount for record in FeeRecord.query.filter(
            FeeRecord.student_id == self.id,
            extract('month', FeeRecord.date_paid) == current_month,
            extract('year', FeeRecord.date_paid) == current_year
        ).all())
        
        if total_paid == 0:
            return 'unpaid'
        elif total_paid < self.fee:
            return 'partial'
        else:
            return 'paid'

    @property
    def remaining_fee(self):
        """Calculate remaining fee for the current month"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        total_paid = sum(record.amount for record in FeeRecord.query.filter(
            FeeRecord.student_id == self.id,
            extract('month', FeeRecord.date_paid) == current_month,
            extract('year', FeeRecord.date_paid) == current_year
        ).all())
        return max(0, self.fee - total_paid)

# Expense Model
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # DateTime for precise date
    user_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=False)  # Foreign key to Admin
    user = relationship('Admin', backref='expenses')  # Relationship with Admin model
    
    def __repr__(self):
        return f"<Expense {self.item_name} {self.price}>"

# Issue Model
class Issue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Admin Model (UserMixin provides useful methods like is_authenticated)
class Admin(db.Model, UserMixin):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)

# Employee Model
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)  # Manager, Cook, etc.
    base_salary = db.Column(db.Float, nullable=False)
    hire_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # active, inactive, terminated
    
    # Relationships
    salary_records = relationship('SalaryRecord', back_populates='employee')
    
    def __repr__(self):
        return f'<Employee {self.name} - {self.position}>'

# SalaryRecord Model
class SalaryRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month_year = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM for monthly tracking
    amount_paid = db.Column(db.Float, nullable=False)
    date_paid = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), default='cash')  # cash, bank_transfer, check, etc.
    notes = db.Column(db.Text)
    
    # Relationships
    employee = relationship('Employee', back_populates='salary_records')
    
    def __repr__(self):
        return f'<SalaryRecord {self.employee.name} - {self.month_year} - Rs{self.amount_paid}>'

# HostelRegistration Model
class HostelRegistration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    emergency_contact = db.Column(db.String(20), nullable=False)
    emergency_contact_name = db.Column(db.String(100), nullable=False)
    university = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year_of_study = db.Column(db.String(20), nullable=False)
    expected_duration = db.Column(db.String(50), nullable=False)
    special_requirements = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, contacted
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin_notes = db.Column(db.Text)
    contacted_at = db.Column(db.DateTime)
    contacted_by = db.Column(db.Integer, db.ForeignKey('admin.id'))
    
    def __repr__(self):
        return f'<HostelRegistration {self.name} - {self.status}>'