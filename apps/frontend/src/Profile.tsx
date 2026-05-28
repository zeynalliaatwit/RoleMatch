import { useState } from 'react';
import { MapPin, Briefcase, FileText, Settings, Grid, Bookmark } from 'lucide-react';

export default function Profile() {
    // Mock data representing the data you'll eventually fetch from your PostgreSQL database
    const [userProfile] = useState({
        name: "Name LastName",
        title: "Senior Computer Science Student",
        university: "Wentworth Institute of Technology",
        location: "Boston, MA",
        bio: "Developer",
        skills: ["TypeScript", "React", "Node.js", "C++", "Python", "Java"],
        stats: {
            applications: 24,
            saved: 12,
            interviews: 3
        }
    });

    return (
        <div style={{ maxWidth: '935px', margin: '0 auto', padding: '2rem', backgroundColor: '#fafafa', minHeight: '100%' }}>

            {/* Top Section: Avatar & Details */}
            <header style={{ display: 'flex', marginBottom: '3rem', paddingBottom: '3rem', borderBottom: '1px solid #dbdbdb' }}>

                {/* Avatar */}
                <div style={{ flex: '1', display: 'flex', justifyContent: 'center', marginRight: '30px' }}>
                    <div style={{
                        width: '150px', height: '150px', borderRadius: '50%',
                        background: 'linear-gradient(45deg, #aa3bff, #c084fc)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '3rem', fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        {userProfile.name.charAt(0)}
                    </div>
                </div>

                {/* Info Column */}
                <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '400', margin: 0 }}>{userProfile.name}</h2>
                        <button style={{ padding: '6px 16px', backgroundColor: '#efefef', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Settings size={16} /> Edit profile
                        </button>
                        <button style={{ padding: '6px 16px', backgroundColor: '#efefef', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={16} /> View Resume
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '2.5rem', fontSize: '1rem' }}>
                        <span><strong style={{ fontWeight: '600' }}>{userProfile.stats.applications}</strong> applications</span>
                        <span><strong style={{ fontWeight: '600' }}>{userProfile.stats.saved}</strong> saved</span>
                        <span><strong style={{ fontWeight: '600' }}>{userProfile.stats.interviews}</strong> interviews</span>
                    </div>

                    {/* Bio Row */}
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: '600' }}>{userProfile.title}</div>
                        <div style={{ color: '#737373', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Briefcase size={14} /> {userProfile.university}
                        </div>
                        <div style={{ color: '#737373', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            <MapPin size={14} /> {userProfile.location}
                        </div>
                        <div>{userProfile.bio}</div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {userProfile.skills.map(skill => (
                                <span key={skill} style={{ backgroundColor: '#efefef', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#262626', fontWeight: '500' }}>
                  {skill}
                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs Layout */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', borderTop: '1px solid transparent', marginTop: '-3rem', paddingTop: '1rem', marginBottom: '2rem' }}>
                <div style={{ cursor: 'pointer', borderTop: '1px solid #000', color: '#000', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '1px' }}>
                    <Grid size={14} /> APPLICATIONS
                </div>
                <div style={{ cursor: 'pointer', color: '#737373', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.75rem', letterSpacing: '1px' }}>
                    <Bookmark size={14} /> SAVED
                </div>
            </div>

            {/* Application Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[1, 2, 3, 4, 5, 6].map(item => (
                    <div key={item} style={{
                        aspectRatio: '1',
                        backgroundColor: '#efefef',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#737373',
                        cursor: 'pointer',
                        transition: 'filter 0.2s'
                    }}>
                        <Briefcase size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Software Engineer</span>
                        <span style={{ fontSize: '0.75rem' }}>Company {item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}