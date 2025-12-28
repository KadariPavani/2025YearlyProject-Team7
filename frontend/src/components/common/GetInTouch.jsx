import React, { useEffect, useRef } from 'react';
import { FaPhone, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function GetInTouch() {
  const formRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const updateMapHeight = () => {
      if (formRef.current) {
        const formH = formRef.current.offsetHeight;
        const targetH = Math.max(220, Math.round(formH * 0.85));
        if (mapRef.current) mapRef.current.style.height = `${targetH}px`;
        if (mapContainerRef.current) mapContainerRef.current.style.height = `${targetH}px`;
      }
    };
    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    return () => window.removeEventListener('resize', updateMapHeight);
  }, []);

  const accent = '#e24b6b';
  const blue = '#5791ED';

  const sharedInput = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e6e9ef',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const name = e.target.name.value;
  const email = e.target.email.value;
  const phone = e.target.phone.value;

  console.log("Sending 👉", { name, email, phone }); // 🧪 debug

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Saved successfully ✅");
      e.target.reset();
    } else {
      alert(data.message || "Something went wrong ❌");
    }
  } catch (error) {
    console.error("Frontend error 👉", error);
    alert("Server error ❌");
  }
};

  
  return (
    <section
      style={{
        fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
        padding: 36,
        background: '#f6f8fb',
        position: 'relative',
      }}
    >
      {/* 🔙 Back to Home Link */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 36,
          color: accent,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Back to Home
      </Link>

      <div style={{ maxWidth: 1200, margin: '60px auto 0' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            borderRadius: 28,
            overflow: 'visible',
            alignItems: 'stretch',
            background: 'white',
            boxShadow: '0 6px 20px rgba(2,6,23,0.06)',
          }}
        >
          {/* Left: white card with form */}
          <div
            ref={formRef}
            style={{
              flex: '0 0 50%',
              width: '50%',
              background: 'white',
              padding: '56px 64px',
              boxSizing: 'border-box',
            }}
          >
            <h1 style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}>
              <span style={{ color: '#111827', fontWeight: 800 }}>Get in </span>
              <span style={{ color: accent, fontWeight: 800 }}>Touch</span>
            </h1>
            <p
              style={{
                color: '#6b7280',
                marginTop: 12,
                marginBottom: 20,
                maxWidth: 460,
              }}
            >
              Enim tempor eget pharetra facilisis sed maecenas adipiscing. Eu leo
              molestie vel, ornare non id blandit netus.
            </p>

            <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
              <div style={{ marginBottom: 12 }}>
                <input
                  name="name"
                  placeholder="Name *"
                  required
                  style={{ ...sharedInput, height: 46 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  style={{ ...sharedInput, height: 46 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  name="phone"
                  placeholder="Phone number *"
                  required
                  style={{ ...sharedInput, height: 46 }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  style={{
                    background: accent,
                    color: 'white',
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  SEND
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 28,
                  marginTop: 26,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaPhone style={{ color: '#111827' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>PHONE</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: accent,
                        fontWeight: 700,
                      }}
                    >
                      03 5432 1234
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaEnvelope style={{ color: '#111827' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>EMAIL</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: accent,
                        fontWeight: 700,
                      }}
                    >
                      info@marcc.com.au
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right: blue rounded shape */}
          <div
            style={{
              flex: '0 0 50%',
              width: '50%',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: -8,
                top: 0,
                bottom: 0,
                width: '60%',
                background: blue,
                borderTopRightRadius: 28,
                borderBottomRightRadius: 28,
              }}
            />
            <div
              ref={mapContainerRef}
              style={{
                position: 'relative',
                width: '74%',
                marginLeft: 'auto',
                marginRight: '6%',
                background: 'white',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 18px 40px rgba(2,6,23,0.08)',
                transform: 'translateX(-18%)',
                top: 28,
              }}
            >
              <iframe
                ref={mapRef}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.792230604352!2d83.297592!3d17.685411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a394ca2f9999999%3A0x7e5b4f3e3a3a3a3a!2sKakinada%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1599999999999"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
