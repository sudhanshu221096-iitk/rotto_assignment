import type { Booking, BookingStatus, Car, ServiceType } from '@/types';

interface BookingCardProps {
  booking: Booking;
  onStatusChange?: (id: string, status: BookingStatus) => void;
}

const getCar = (booking: Booking): Car | null => {
  if (booking.carId && typeof booking.carId === 'object') {
    return booking.carId as Car;
  }
  return null;
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  'oil-change': 'Oil Change',
  'tire-rotation': 'Tire Rotation',
  'brake-inspection': 'Brake Inspection',
  'full-service': 'Full Service',
  'battery-check': 'Battery Check',
};

const ACTIVE_STATUSES = new Set<BookingStatus>(['pending', 'confirmed', 'in-progress']);

export default function BookingCard({ booking, onStatusChange }: BookingCardProps): React.ReactElement {
  const car = getCar(booking);
  const isActive = ACTIVE_STATUSES.has(booking.status);

  return (
    <div className="rt-booking-card">
      <div className="rt-booking-card__header">
        <p className="rt-booking-card__service">
          {SERVICE_LABELS[booking.serviceType]}
        </p>
        <span className={`rt-booking-status rt-booking-status--${booking.status}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      <p className="rt-booking-card__date">
        {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {car && (
        <p className="rt-booking-card__car">
          {car.year} {car.make} {car.model} — {car.registrationNumber}
        </p>
      )}

      {booking.estimatedCost > 0 && (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Est. cost: ₹{booking.estimatedCost.toLocaleString('en-IN')}
        </p>
      )}

      {booking.notes && (
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem', fontStyle: 'italic' }}>
          {booking.notes}
        </p>
      )}

      {onStatusChange && isActive && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {booking.status === 'pending' && (
            <>
              <button
                className="rt-btn rt-btn--primary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                onClick={() => onStatusChange(booking._id, 'confirmed')}
              >
                Confirm
              </button>
              <button
                className="rt-btn rt-btn--danger"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                onClick={() => onStatusChange(booking._id, 'cancelled')}
              >
                Cancel
              </button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <>
              <button
                className="rt-btn rt-btn--primary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                onClick={() => onStatusChange(booking._id, 'in-progress')}
              >
                Start Service
              </button>
              <button
                className="rt-btn rt-btn--danger"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                onClick={() => onStatusChange(booking._id, 'cancelled')}
              >
                Cancel
              </button>
            </>
          )}
          {booking.status === 'in-progress' && (
            <button
              className="rt-btn rt-btn--primary"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
              onClick={() => onStatusChange(booking._id, 'completed')}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
