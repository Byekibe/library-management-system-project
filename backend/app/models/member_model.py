from app.extensions import db

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    outstanding_debt = db.Column(db.Numeric(10, 2), default=0.00) # Use Numeric for currency

    def __repr__(self):
        return f"<Member(name='{self.name}')>"