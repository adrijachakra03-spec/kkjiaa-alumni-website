

import { useEffect, useState } from "react";

import Admin from "./Admin";

import {

  Menu,

  X,

  ArrowUpRight,

  Users,

  BookOpen,

  HeartHandshake,

  GraduationCap,

  CalendarDays,

  MapPin,

  Phone,

  Mail,

  Camera,

  ShieldCheck,

  Newspaper,

  Upload,

} from "lucide-react";



const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");



const photos = {

  building: "/images/school-building.jpg",

  courtyard: "/images/school-courtyard.jpg",

  entrance: "/images/school-entrance.jpg",

  memories: "/images/school-memories.jpg",

  playground: "/images/school-playground.jpg",

};



const events = [

  {

    date: "01",

    month: "NOV",

    type: "COMMUNITY",

    title: "Reconnect with your school",

    description:

      "Help us bring former classmates together and build a stronger alumni community.",

  },

  {

    date: "15",

    month: "NOV",

    type: "STUDENT SUPPORT",

    title: "Share your experience",

    description:

      "Alumni can volunteer their time to guide students on further studies and career choices.",

  },

  {

    date: "06",

    month: "DEC",

    type: "INITIATIVE",

    title: "A little help goes a long way",

    description:

      "Explore ways to support students through learning resources, mentorship and scholarships.",

  },

];



function SectionHeading({ eyebrow, title, description, light = false }) {

  return (

    <div className={`section-heading ${light ? "heading-light" : ""}`}>

      <span className="eyebrow">{eyebrow}</span>

      <h2>{title}</h2>

      {description && <p>{description}</p>}

    </div>

  );

}



function Modal({ title, subtitle, onClose, children }) {

  return (

    <div

      className="modal-backdrop"

      role="presentation"

      onMouseDown={(event) => {

        if (event.target === event.currentTarget) onClose();

      }}

    >

      <div

        className="modal-panel"

        role="dialog"

        aria-modal="true"

        aria-labelledby="modal-title"

      >

        <button

          className="modal-close"

          onClick={onClose}

          aria-label="Close dialog"

          type="button"

        >

          <X size={20} />

        </button>

        <span className="eyebrow">KKJIAA COMMUNITY</span>

        <h2 id="modal-title">{title}</h2>

        {subtitle && <p className="modal-subtitle">{subtitle}</p>}

        {children}

      </div>

    </div>

  );

}



function HomePage() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [alumni, setAlumni] = useState([]);
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [alumniError, setAlumniError] = useState("");

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        if (!API_URL) {
          throw new Error("Backend URL is not configured.");
        }

        const response = await fetch(`${API_URL}/api/alumni/approved`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load alumni profiles.");
        }

        setAlumni(data.alumni || []);
      } catch (error) {
        console.error("Alumni directory error:", error);
        setAlumniError(error.message || "Could not load alumni profiles.");
      } finally {
        setAlumniLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const [modal, setModal] = useState("");

  const [notice, setNotice] = useState("");

  const [photoPreview, setPhotoPreview] = useState("");



  const [registration, setRegistration] = useState({

    name: "",

    batch: "",

    year: "",

    email: "",

    phone: "",

    occupation: "",

    bio: "",

    photo: null,

    consent: false,

  });



  const [contact, setContact] = useState({

    name: "",

    email: "",

    message: "",

  });



  const [scholarship, setScholarship] = useState({

    name: "",

    email: "",

    schoolYear: "",

    reason: "",

  });



  const openModal = (name) => {

    setNotice("");

    setModal(name);

    setMenuOpen(false);

  };



  const closeModal = () => {

    setModal("");

    setNotice("");

  };



  const updateRegistration = (event) => {

    const { name, value, type, checked, files } = event.target;



    if (name === "photo" && files?.[0]) {

      const file = files[0];



      if (!file.type.startsWith("image/")) {

        setNotice("Please select an image file.");

        return;

      }



      if (file.size > 5 * 1024 * 1024) {

        setNotice("Please choose an image smaller than 5 MB.");

        return;

      }



      setPhotoPreview(URL.createObjectURL(file));



      setRegistration((previous) => ({

        ...previous,

        photo: file,

      }));



      setNotice("");

      return;

    }



    setRegistration((previous) => ({

      ...previous,

      [name]: type === "checkbox" ? checked : value,

    }));

  };



  // ALUMNI REGISTRATION — CONNECTED TO RENDER BACKEND

  const submitRegistration = async (event) => {

    event.preventDefault();

    setNotice("");



    if (!API_URL) {

      setNotice("The server address is not configured. Please try again later.");

      return;

    }



    if (!registration.consent) {

      setNotice("Please confirm your consent before continuing.");

      return;

    }



    const year = Number(registration.year);



    if (

      !registration.year ||

      !Number.isInteger(year) ||

      year < 1888 ||

      year > new Date().getFullYear()

    ) {

      setNotice("Please enter a valid year attended.");

      return;

    }



    try {

      const formData = new FormData();



      formData.append("fullName", registration.name.trim());

      formData.append("email", registration.email.trim());

      formData.append("phone", registration.phone.trim());

      formData.append("passingYear", String(year));

      formData.append("profession", registration.occupation.trim());

      formData.append("message", registration.bio.trim());

      formData.append("consent", "true");



      if (registration.photo) {

        formData.append("photo", registration.photo);

      }



      const response = await fetch(

        `${API_URL}/api/alumni/register`,

        {

          method: "POST",

          body: formData,

        }

      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Registration failed.");

      }



      setNotice(

        "Registration submitted successfully! Your details are pending admin approval."

      );



      setRegistration({

        name: "",

        batch: "",

        year: "",

        email: "",

        phone: "",

        occupation: "",

        bio: "",

        photo: null,

        consent: false,

      });



      setPhotoPreview("");



      event.target.reset();

    } catch (error) {

      console.error("Registration error:", error);



      setNotice(

        error.message || "Could not connect to the server. Please try again."

      );

    }

  };



  const submitContact = (event) => {

    event.preventDefault();

    setNotice(

      "Demo only: this message has not been sent. We will connect this form to a secure contact service later."

    );

  };



  const submitScholarship = (event) => {

    event.preventDefault();

    setNotice(

      "Demo only: this application has not been submitted or saved. Scholarship applications need a secure backend and restricted document access."

    );

  };



  const navLinks = [

    ["Our story", "#story"],

    ["Alumni", "#alumni"],

    ["Activities", "#events"],

    ["Student support", "#support"],

    ["Contact", "#contact"],

  ];



  return (

    <div className="site-shell">

      <header className="site-header">

        <a className="brand" href="#home" aria-label="KKJIAA home">

          <span className="brand-mark">KJ</span>

          <span className="brand-copy">

            <strong>K. K. Jnanada Institution</strong>

            <small>ALUMNI ASSOCIATION</small>

          </span>

        </a>



        <button

          className="mobile-menu-button"

          onClick={() => setMenuOpen((previous) => !previous)}

          aria-label={menuOpen ? "Close navigation" : "Open navigation"}

          aria-expanded={menuOpen}

          type="button"

        >

          {menuOpen ? <X size={23} /> : <Menu size={23} />}

        </button>



        <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>

          {navLinks.map(([label, href]) => (

            <a key={href} href={href} onClick={() => setMenuOpen(false)}>

              {label}

            </a>

          ))}



          <button

            className="button button-green nav-cta"

            onClick={() => openModal("register")}

            type="button"

          >

            Join us <ArrowUpRight size={16} />

          </button>

        </nav>

      </header>



      <main>

        <section className="hero" id="home">

          <div className="hero-copy">

            <span className="eyebrow">

              <span className="eyebrow-dot" />

              A COMMUNITY ROOTED IN SHARED MEMORIES

            </span>



            <h1>

              Once a student.

              <br />

              <em>Always a part</em>

              <br />

              of the family.

            </h1>



            <p className="hero-description">

              A place for the people who once walked these school corridors

              to find one another again — and help the next generation find

              their way forward.

            </p>



            <div className="hero-actions">

              <button

                className="button button-green"

                onClick={() => openModal("register")}

                type="button"

              >

                Reconnect with us <ArrowUpRight size={17} />

              </button>



              <a className="text-link" href="#story">

                Discover our story <span>↓</span>

              </a>

            </div>



            <div className="hero-footnote">

              <MapPin size={15} />

              <span>Gopalnagar, Khanakul, Hooghly, West Bengal</span>

            </div>

          </div>



          <div className="hero-visual">

            <div className="hero-photo-frame">

              <img

                src={photos.building}

                alt="K. K. Jnanada Institution school building"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                  event.currentTarget.parentElement.classList.add(

                    "photo-missing"

                  );

                }}

              />



              <div className="photo-caption">

                <span className="caption-mark">✳</span>

                <span>

                  <strong>Our school. Our roots.</strong>

                  <small>A shared story across generations</small>

                </span>

              </div>

            </div>



            <div className="hero-stamp" aria-hidden="true">

              <span>LEARN</span>

              <span>GROW</span>

              <span>GIVE BACK</span>

              <span className="stamp-star">✳</span>

            </div>



            <div className="hero-note">

              <span className="note-line" />

              <span>A little place that stays with you.</span>

            </div>

          </div>



          <div className="hero-bottom-rule">

            <span>MEMORIES THAT CONNECT US</span>

            <span>COMMUNITY THAT MOVES US FORWARD</span>

          </div>

        </section>



        <section className="intro-strip" id="story">

          <div className="intro-label">

            <span className="eyebrow">MORE THAN A SCHOOL</span>

            <span className="intro-flower">✳</span>

          </div>



          <p>

            Some places become part of who we are. Our school is one of

            them. This alumni initiative is about staying connected,

            sharing what we have learned and making the road a little easier

            for the students who follow us.

          </p>



          <a

            href="#community"

            className="round-arrow"

            aria-label="Read about our community"

          >

            <ArrowUpRight size={22} />

          </a>

        </section>



        <section className="story-section section" id="community">

          <div className="story-grid">

            <div className="story-image-stack">

              <img

                className="story-image-main"

                src={photos.courtyard}

                alt="School courtyard"

                loading="lazy"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />



              <img

                className="story-image-small"

                src={photos.entrance}

                alt="School entrance"

                loading="lazy"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />



              <span className="image-side-note">A PLACE TO REMEMBER</span>

            </div>



            <div className="story-copy">

              <SectionHeading

                eyebrow="OUR STORY"

                title="The years pass. The connection stays."

                description="A school community is made up of countless stories — first friendships, favourite teachers, lessons learned and dreams that began to take shape."

              />



              <p>

                K. K. Jnanada Institution, in Gopalnagar, Khanakul, Hooghly,

                West Bengal, has been part of the educational story of this

                region for generations. We want this space to help former

                students reconnect and find meaningful ways to support

                today's learners.

              </p>



              <p>

                We are building an alumni-led community for sharing

                experiences, exploring mentorship and supporting students

                through practical initiatives.

              </p>



              <div className="story-note">

                <span className="note-flower">✳</span>

                <p>

                  <strong>Built around people, not just memories.</strong>

                  <br />

                  A growing initiative shaped by the alumni who take part.

                </p>

              </div>



              <a href="#support" className="text-link">

                See how you can help <span>→</span>

              </a>

            </div>

          </div>

        </section>



        <section className="values-section">

          <div className="section">

            <SectionHeading

              eyebrow="WHAT BRINGS US TOGETHER"

              title="A community with room for everyone."

              description="You don't need to have everything figured out to make a difference. Sometimes sharing your time or experience is enough."

            />



            <div className="values-grid">

              <article className="value-item">

                <span className="value-icon"><Users size={24} /></span>

                <span className="value-number">01</span>

                <h3>Reconnect</h3>

                <p>

                  Find former classmates, rediscover shared memories and

                  grow a welcoming alumni network.

                </p>

              </article>



              <article className="value-item">

                <span className="value-icon"><BookOpen size={24} /></span>

                <span className="value-number">02</span>

                <h3>Share knowledge</h3>

                <p>

                  Help students explore higher education, career paths,

                  skills and opportunities.

                </p>

              </article>



              <article className="value-item">

                <span className="value-icon"><HeartHandshake size={24} /></span>

                <span className="value-number">03</span>

                <h3>Give back</h3>

                <p>

                  Contribute time, learning resources or support to

                  student-focused community initiatives.

                </p>

              </article>

            </div>

          </div>

        </section>



        <section className="gallery-section section" id="memories">

          <div className="gallery-heading-row">

            <SectionHeading

              eyebrow="FROM OUR SCHOOL"

              title="Familiar corners. Lasting memories."

              description="A small gallery of the place that connects us. Add your real school photographs to the images folder to bring this section to life."

            />



            <span className="gallery-aside">

              THE PLACE WE SHARE · EST. 1888*

            </span>

          </div>



          <div className="photo-gallery">

            <figure className="gallery-large">

              <img

                src={photos.memories}

                alt="A view of the school"

                loading="lazy"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />

              <figcaption>Where our stories began</figcaption>

            </figure>



            <figure>

              <img

                src={photos.playground}

                alt="School grounds"

                loading="lazy"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />

              <figcaption>Room to grow</figcaption>

            </figure>



            <figure>

              <img

                src={photos.entrance}

                alt="School entrance"

                loading="lazy"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />

              <figcaption>A familiar welcome</figcaption>

            </figure>

          </div>



          <p className="gallery-footnote">

            *The school's establishment year should be verified before

            publication. The year 1888 has been reported in the school's

            public description.

          </p>

        </section>



        <section className="directory-section" id="alumni">

          <div className="section directory-layout">

            <div className="directory-intro">

              <span className="eyebrow">OUR ALUMNI</span>



              <h2>

                Many journeys.

                <br />

                <em>One shared beginning.</em>

              </h2>



              <p>

                The alumni directory will help former students find one

                another and discover people willing to share their

                experiences. Profiles should only appear publicly after

                the alum gives consent and an administrator approves them.

              </p>



              <button

                className="button button-outline"

                onClick={() => openModal("register")}

                type="button"

              >

                Register as an alumnus <ArrowUpRight size={16} />

              </button>



              <div className="privacy-note">

                <ShieldCheck size={18} />

                <span>Public profiles require consent and approval.</span>

              </div>

            </div>



            <div className="directory-preview">

              <div className="directory-topline">

                <span><Users size={17} /> ALUMNI DIRECTORY</span>

                <span className="status-dot">{alumniLoading ? "LOADING" : `${alumni.length} APPROVED`}</span>

              </div>



              {alumniLoading ? (
                <div className="empty-directory">
                  <div className="empty-icon"><Users size={28} /></div>
                  <h3>Finding our alumni...</h3>
                  <p>Please wait while we load approved profiles.</p>
                </div>
              ) : alumniError ? (
                <div className="empty-directory">
                  <div className="empty-icon"><Users size={28} /></div>
                  <h3>Directory unavailable</h3>
                  <p>{alumniError}</p>
                </div>
              ) : alumni.length === 0 ? (
                <div className="empty-directory">
                  <div className="empty-icon"><Users size={28} /></div>
                  <h3>Your school family starts here.</h3>
                  <p>No approved alumni profiles are available yet. Register above to join our community.</p>
                </div>
              ) : (
                <div className="alumni-grid">
                  {alumni.map((person) => (
                    <article className="alumni-card" key={person._id}>
                      {person.profilePhotoUrl ? (
                        <img
                          className="alumni-card-photo"
                          src={person.profilePhotoUrl}
                          alt={person.fullName || "Alumni profile"}
                          loading="lazy"
                        />
                      ) : (
                        <div className="alumni-card-initial" aria-hidden="true">
                          {person.fullName?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                      )}
                      <div className="alumni-card-info">
                        <h3>{person.fullName}</h3>
                        <p>Batch of {person.passingYear}</p>
                        {person.profession && <span>{person.profession}</span>}
                        {person.currentCity && <small>{person.currentCity}</small>}
                      </div>
                    </article>
                  ))}
                </div>
              )}



              <div className="directory-bottomline">

                <span>CONSENT FIRST</span>

                <span>PRIVACY MATTERS</span>

              </div>

            </div>

          </div>

        </section>



        <section className="events-section section" id="events">

          <div className="events-header">

            <SectionHeading

              eyebrow="STAY CONNECTED"

              title="Small steps. Shared purpose."

              description="Community activities can start with a conversation. Help us shape meaningful meet-ups, mentoring and student-support initiatives."

            />



            <a href="#contact" className="text-link">

              Suggest an activity <span>→</span>

            </a>

          </div>



          <div className="events-grid">

            {events.map((event) => (

              <article className="event-card" key={event.title}>

                <div className="event-date">

                  <strong>{event.date}</strong>

                  <span>{event.month}</span>

                </div>



                <div className="event-content">

                  <span className="eyebrow">{event.type}</span>

                  <h3>{event.title}</h3>

                  <p>{event.description}</p>



                  <a

                    href="#contact"

                    className="event-link"

                    aria-label={`Ask about ${event.title}`}

                  >

                    Get involved <ArrowUpRight size={16} />

                  </a>

                </div>

              </article>

            ))}

          </div>



          <p className="section-footnote">

            These are proposed community activities, not confirmed events.

            Dates are illustrative and should be replaced before publishing.

          </p>

        </section>



        <section className="support-section" id="support">

          <div className="section support-layout">

            <div className="support-copy">

              <span className="eyebrow">LOOKING AHEAD</span>



              <h2>

                Someone helped us get here.

                <br />

                <em>We can help someone next.</em>

              </h2>



              <p>

                Alumni can make a difference by sharing guidance, helping

                students understand their options, contributing learning

                materials or supporting carefully managed scholarship

                initiatives.

              </p>



              <button

                className="button button-cream"

                onClick={() => openModal("volunteer")}

                type="button"

              >

                Explore volunteering <ArrowUpRight size={17} />

              </button>

            </div>



            <div className="support-options">

              <button

                className="support-option"

                onClick={() => openModal("volunteer")}

                type="button"

              >

                <span className="support-option-icon">

                  <HeartHandshake size={22} />

                </span>

                <span>

                  <strong>Mentorship & volunteering</strong>

                  <small>Share your time, skills or career experience.</small>

                </span>

                <ArrowUpRight size={19} />

              </button>



              <button

                className="support-option"

                onClick={() => openModal("scholarship")}

                type="button"

              >

                <span className="support-option-icon">

                  <GraduationCap size={22} />

                </span>

                <span>

                  <strong>Student scholarships</strong>

                  <small>Help shape a fair, transparent support process.</small>

                </span>

                <ArrowUpRight size={19} />

              </button>



              <a className="support-option" href="#contact">

                <span className="support-option-icon">

                  <BookOpen size={22} />

                </span>

                <span>

                  <strong>Learning resources</strong>

                  <small>Suggest books, materials or useful opportunities.</small>

                </span>

                <ArrowUpRight size={19} />

              </a>

            </div>

          </div>

        </section>



        <section className="news-section section" id="news">

          <div className="news-heading">

            <SectionHeading

              eyebrow="FROM THE COMMUNITY"

              title="Notes from our alumni circle."

              description="A space for verified updates, community stories and future announcements."

            />



            <span className="news-icon"><Newspaper size={27} /></span>

          </div>



          <div className="news-placeholder">

            <span className="news-placeholder-icon">

              <CalendarDays size={22} />

            </span>



            <div>

              <h3>Our community noticeboard is taking shape.</h3>

              <p>

                News and announcements will be added when they have been

                confirmed by the association's organizers.

              </p>

            </div>

          </div>

        </section>



        <section className="contact-section" id="contact">

          <div className="section contact-layout">

            <div className="contact-copy">

              <span className="eyebrow">LET'S START A CONVERSATION</span>



              <h2>

                Have a story to share?

                <br />

                <em>We'd love to hear it.</em>

              </h2>



              <p>

                Want to reconnect, volunteer, share a school memory or

                suggest an initiative? Send us a message.

              </p>



              <div className="contact-detail">

                <MapPin size={18} />

                <span>

                  K. K. Jnanada Institution

                  <small>

                    Gopalnagar, Nangulpara, Khanakul, Hooghly, West Bengal, India

                  </small>

                </span>

              </div>



              <div className="contact-detail">

                <Mail size={18} />

                <span>

                  Association contact

                  <small>Add a verified association email before launch.</small>

                </span>

              </div>



              <div className="contact-detail">

                <Phone size={18} />

                <span>

                  School contact

                  <small>Verify the published school telephone number before use.</small>

                </span>

              </div>

            </div>



            <form className="contact-form" onSubmit={submitContact}>

              <span className="eyebrow">SEND A MESSAGE</span>



              <label>

                Your name

                <input

                  required

                  name="name"

                  value={contact.name}

                  onChange={(event) =>

                    setContact({ ...contact, name: event.target.value })

                  }

                  placeholder="How should we address you?"

                />

              </label>



              <label>

                Email address

                <input

                  required

                  type="email"

                  name="email"

                  value={contact.email}

                  onChange={(event) =>

                    setContact({ ...contact, email: event.target.value })

                  }

                  placeholder="you\@example.com"

                />

              </label>



              <label>

                Your message

                <textarea

                  required

                  rows="4"

                  name="message"

                  value={contact.message}

                  onChange={(event) =>

                    setContact({ ...contact, message: event.target.value })

                  }

                  placeholder="Tell us what you have in mind..."

                />

              </label>



              <button className="button button-green button-full" type="submit">

                Send message <ArrowUpRight size={17} />

              </button>



              <p className="form-small">

                Prototype form: your message is not sent or stored yet.

              </p>



              {notice && modal === "" && (

                <p className="form-notice" role="status">{notice}</p>

              )}

            </form>

          </div>

        </section>

      </main>



      <footer className="site-footer">

        <a className="brand footer-brand" href="#home">

          <span className="brand-mark">KJ</span>

          <span className="brand-copy">

            <strong>K. K. Jnanada Institution</strong>

            <small>ALUMNI ASSOCIATION</small>

          </span>

        </a>



        <p>Made with care for the people and memories that connect us.</p>



        <a href="#home" className="back-to-top">

          Back to top ↑

        </a>



        <div className="footer-bottom">

          <span>© {new Date().getFullYear()} KKJIAA Alumni Initiative</span>

          <span>

            Independent alumni initiative · Not the school's administration

          </span>

        </div>

      </footer>



      {modal === "register" && (

        <Modal

          title="Let's find our way back."

          subtitle="Register your interest in joining the alumni community."

          onClose={closeModal}

        >

          <form className="modal-form" onSubmit={submitRegistration}>

            <label>

              Full name *

              <input

                name="name"

                required

                value={registration.name}

                onChange={updateRegistration}

                placeholder="Your full name"

              />

            </label>



            <div className="form-two-col">

              <label>

                Batch / class

                <input

                  name="batch"

                  value={registration.batch}

                  onChange={updateRegistration}

                  placeholder="e.g. Class X"

                />

              </label>



              <label>

                Year attended *

                <input

                  name="year"

                  type="number"

                  required

                  min="1888"

                  max={new Date().getFullYear()}

                  value={registration.year}

                  onChange={updateRegistration}

                  placeholder="e.g. 2018"

                />

              </label>

            </div>



            <label>

              Email address *

              <input

                name="email"

                type="email"

                required

                value={registration.email}

                onChange={updateRegistration}

                placeholder="you\@example.com"

              />

            </label>



            <label>

              Phone number (optional)

              <input

                name="phone"

                type="tel"

                value={registration.phone}

                onChange={updateRegistration}

                placeholder="Your phone number"

              />

            </label>



            <label>

              Current work / studies (optional)

              <input

                name="occupation"

                value={registration.occupation}

                onChange={updateRegistration}

                placeholder="What are you doing now?"

              />

            </label>



            <label>

              A little about yourself (optional)

              <textarea

                name="bio"

                rows="3"

                value={registration.bio}

                onChange={updateRegistration}

                placeholder="Share what you would like fellow alumni to know."

              />

            </label>



            <label className="upload-label">

              <span className="upload-icon"><Camera size={20} /></span>



              <span>

                <strong>Profile photo (optional)</strong>

                <small>Choose an image from your device, up to 5 MB.</small>

              </span>



              <Upload size={18} />



              <input

                type="file"

                name="photo"

                accept="image/*"

                onChange={updateRegistration}

              />

            </label>



            {photoPreview && (

              <div className="photo-preview">

                <img src={photoPreview} alt="Selected profile preview" />

                <span>{registration.photo?.name}</span>

              </div>

            )}



            <label className="consent-check">

              <input

                type="checkbox"

                name="consent"

                checked={registration.consent}

                onChange={updateRegistration}

                required

              />



              <span>

                I agree to have my registration reviewed. I understand

                that my profile must not be made public without my consent

                and administrator approval.

              </span>

            </label>



            <button className="button button-green button-full" type="submit">

              Submit registration interest <ArrowUpRight size={17} />

            </button>



            <p className="form-small">

              Your details and optional profile photo will be submitted

              for review. Your profile will only appear after administrator

              approval.

            </p>



            {notice && (

              <p className="form-notice" role="status">{notice}</p>

            )}

          </form>

        </Modal>

      )}



      {modal === "volunteer" && (

        <Modal

          title="Share what you know."

          subtitle="We welcome alumni interested in helping students and strengthening the community."

          onClose={closeModal}

        >

          <div className="modal-info-list">

            <div>

              <HeartHandshake size={20} />

              <span>

                <strong>Mentorship</strong>

                <small>Offer guidance on studies, careers or skills.</small>

              </span>

            </div>



            <div>

              <BookOpen size={20} />

              <span>

                <strong>Learning resources</strong>

                <small>Suggest books, workshops or useful learning material.</small>

              </span>

            </div>



            <div>

              <Users size={20} />

              <span>

                <strong>Community support</strong>

                <small>Help organize reunions and alumni initiatives.</small>

              </span>

            </div>

          </div>



          <a

            className="button button-green button-full"

            href="#contact"

            onClick={closeModal}

          >

            Tell us how you'd like to help <ArrowUpRight size={17} />

          </a>



          <p className="form-small">

            Activities are proposals until organizers confirm them.

          </p>

        </Modal>

      )}



      {modal === "scholarship" && (

        <Modal

          title="Student support begins with care."

          subtitle="This is an interest form preview, not an active scholarship application."

          onClose={closeModal}

        >

          <form className="modal-form" onSubmit={submitScholarship}>

            <label>

              Student name *

              <input

                required

                value={scholarship.name}

                onChange={(event) =>

                  setScholarship({

                    ...scholarship,

                    name: event.target.value,

                  })

                }

                placeholder="Student's full name"

              />

            </label>



            <label>

              Contact email *

              <input

                required

                type="email"

                value={scholarship.email}

                onChange={(event) =>

                  setScholarship({

                    ...scholarship,

                    email: event.target.value,

                  })

                }

                placeholder="you\@example.com"

              />

            </label>



            <label>

              Current class / year

              <input

                value={scholarship.schoolYear}

                onChange={(event) =>

                  setScholarship({

                    ...scholarship,

                    schoolYear: event.target.value,

                  })

                }

                placeholder="Class or year of study"

              />

            </label>



            <label>

              What support are you looking for?

              <textarea

                rows="3"

                value={scholarship.reason}

                onChange={(event) =>

                  setScholarship({

                    ...scholarship,

                    reason: event.target.value,

                  })

                }

                placeholder="Please do not include sensitive financial or identity documents here."

              />

            </label>



            <button className="button button-green button-full" type="submit">

              Preview interest submission <ArrowUpRight size={17} />

            </button>



            <p className="form-small">

              No documents are requested or stored here. A real scholarship

              process needs published eligibility criteria, a secure backend

              and restricted reviewer access.

            </p>



            {notice && (

              <p className="form-notice" role="status">{notice}</p>

            )}

          </form>

        </Modal>

      )}

    </div>

  );

}



function App() {

  if (window.location.pathname.replace(/\/+$/, "") === "/admin") {

    return <Admin />;

  }



  return <HomePage />;

}



export default App;
