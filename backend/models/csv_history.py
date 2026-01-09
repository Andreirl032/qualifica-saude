from datetime import datetime
from models.database import db


class CSVHistory(db.Model):
    __tablename__ = 'csv_history'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    rows = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'rows': self.rows,
            'status': self.status,
            'timestamp': self.timestamp
        }
