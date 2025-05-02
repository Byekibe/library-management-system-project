from app.extensions import db

class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    isbn = db.Column(db.String(13), unique=True, nullable=True) # ISBN is useful
    total_stock = db.Column(db.Integer, default=0)
    available_stock = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<Book(title='{self.title}', author='{self.author}')>"