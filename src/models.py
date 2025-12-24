from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from src.database import Base

class User(Base):
    __tablename__ = "users"
    flat_number = Column(Integer, primary_key=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    contact_id = Column(Integer, nullable=False)
    role = Column(String(255), nullable=False) 

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    flat_number = Column(Integer, ForeignKey("users.flat_number"), nullable=False)
    date = Column(Date, nullable=False)
    month = Column(String(255), nullable=False)
    year = Column(Integer, nullable=False)
    expense_name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)

class Maintenance(Base):
    __tablename__ = "maintenance"
    id = Column(Integer, primary_key=True, index=True)
    owner_name = Column(String(255), nullable=False)
    flat_number = Column(Integer, ForeignKey("users.flat_number"), nullable=False)
    date = Column(Date, nullable=False)
    month = Column(String(255), nullable=False)
    year = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)
    updated_by = Column(Integer, nullable=True)