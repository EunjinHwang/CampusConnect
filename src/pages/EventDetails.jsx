import { Link, useParams } from 'react-router-dom'

import techMeetup from '../assets/tech-meetup.jpg'
import careerFair from '../assets/career-fair.jpg'
import basketball from '../assets/basketball.jpg'

function EventDetails() {
  const { eventId } = useParams()

  const events = {
    'tech-meetup': {
      title: 'Tech Meetup',
      category: 'Workshop',
      date: 'October 15, 2026 at 6:00 PM',
      location: 'Fanshawe College',
      image: techMeetup,
      description:
        'Connect with students and explore the latest technology. Meet other students, share ideas, and learn about new developments in technology.',
    },

    'career-fair': {
      title: 'Career Fair',
      category: 'Career',
      date: 'November 10, 2026 at 2:00 PM',
      location: 'Student Centre',
      image: careerFair,
      description:
        'Meet employers and explore career opportunities. Connect with organizations, learn about available positions, and build your professional network.',
    },

    'basketball-tournament': {
      title: 'Basketball Tournament',
      category: 'Sports',
      date: 'November 25, 2026 at 5:00 PM',
      location: 'Athletics Centre',
      image: basketball,
      description:
        'Join us for an exciting campus basketball tournament. Come support the teams and enjoy an evening of campus sports and competition.',
    },
  }

  const event = events[eventId]

  if (!event) {
    return (
      <main className="event-details-page">
        <h1>Event not found</h1>
        <Link to="/events" className="back-events">
          ← Back to Events
        </Link>
      </main>
    )
  }

  return (
    <main className="event-details-page">

      <Link to="/events" className="back-events">
        ← Back to Events
      </Link>

      <div className="event-details-card">

        <img
          src={event.image}
          alt={event.title}
          className="event-details-image"
        />

        <div className="event-details-content">

          <span className="event-category">
            {event.category}
          </span>

          <h1>{event.title}</h1>

          <p className="event-details-date">
            📅 {event.date}
          </p>

          <p className="event-details-location">
            📍 {event.location}
          </p>

          <h3>About this event</h3>

          <p>{event.description}</p>

          <button className="register-event-button">
            Register for Event
          </button>

        </div>

      </div>

    </main>
  )
}

export default EventDetails