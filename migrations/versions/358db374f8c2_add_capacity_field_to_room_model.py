"""Initial schema with room capacity

Revision ID: 358db374f8c2
Revises: 
Create Date: 2025-06-01 23:29:30.285321

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '358db374f8c2'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'admin',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=100), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
    )

    op.create_table(
        'employee',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('position', sa.String(length=100), nullable=False),
        sa.Column('base_salary', sa.Float(), nullable=False),
        sa.Column('hire_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='active'),
    )

    op.create_table(
        'issue',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'room',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('room_number', sa.Integer(), nullable=False, unique=True),
        sa.Column('capacity', sa.Integer(), nullable=True, server_default='4'),
    )

    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=150), nullable=False, unique=True),
        sa.Column('email', sa.String(length=150), nullable=False, unique=True),
        sa.Column('password', sa.String(length=150), nullable=False),
    )

    op.create_table(
        'student',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=True, unique=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('fee', sa.Float(), nullable=False),
        sa.Column('room_id', sa.Integer(), sa.ForeignKey('room.id'), nullable=False),
        sa.Column('picture', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='active'),
        sa.Column('fee_status', sa.String(length=20), nullable=True, server_default='unpaid'),
        sa.Column('enrollment_date', sa.DateTime(), nullable=True),
        sa.Column('last_fee_payment', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'expense',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('item_name', sa.String(length=100), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('admin.id'), nullable=False),
    )

    op.create_table(
        'salary_record',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('employee_id', sa.Integer(), sa.ForeignKey('employee.id'), nullable=False),
        sa.Column('month_year', sa.String(length=7), nullable=False),
        sa.Column('amount_paid', sa.Float(), nullable=False),
        sa.Column('date_paid', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True, server_default='cash'),
        sa.Column('notes', sa.Text(), nullable=True),
    )

    op.create_table(
        'fee_record',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('student.id'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('date_paid', sa.Date(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True, server_default='cash'),
        sa.Column('month_year', sa.String(length=7), nullable=False),
    )


def downgrade():
    op.drop_table('fee_record')
    op.drop_table('salary_record')
    op.drop_table('expense')
    op.drop_table('student')
    op.drop_table('user')
    op.drop_table('room')
    op.drop_table('issue')
    op.drop_table('employee')
    op.drop_table('admin')
