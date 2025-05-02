from app.extensions import db

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False)
    issue_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime, nullable=True)
    fee_charged = db.Column(db.Numeric(10, 2), default=0.00)
    is_returned = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), default='Issued') # e.g., 'Issued', 'Returned', 'Overdue'

    # Optional: Relationships if you plan to use ORM for simple fetches
    # book = db.relationship('Book', backref=db.backref('transactions', lazy=True))
    # member = db.relationship('Member', backref=db.backref('transactions', lazy=True))


    def __repr__(self):
        return f"<Transaction(book_id={self.book_id}, member_id={self.member_id}, status='{self.status}')>"