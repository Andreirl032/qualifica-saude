from datetime import datetime
from models.database import db


class Procedure(db.Model):
    __tablename__ = 'procedures'

    id = db.Column(db.String(50), primary_key=True)
    patient_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    facility = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    patient = db.relationship('User', back_populates='procedures')
    required_documents = db.relationship('Document', back_populates='procedure', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'name': self.name,
            'date': self.date,
            'facility': self.facility,
            'status': self.status,
            'requiredDocuments': [doc.to_dict() for doc in self.required_documents]
        }
