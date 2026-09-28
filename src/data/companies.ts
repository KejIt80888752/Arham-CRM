import type { Company, CompanyId } from './types'

export const COMPANIES: Company[] = [
  {
    id: 'signages', name: 'Arham Signages', short: 'SIG', tagline: 'Signs that build business',
    color: '#f08a24', website: 'arhamsignages.com',
    services: ['Exterior Signages', 'Internal Graphics', 'Glass Branding', 'Vehicle Graphics', 'Neon LED Signages', '3D Signages', 'LED Letter Signs', 'Hoardings', 'Pylons', 'Light Boxes'],
  },
  {
    id: 'displays', name: 'Arham Displays', short: 'DSP', tagline: 'Promotional Display Experts',
    color: '#e8590c', website: 'arhamdisplays.com',
    services: ['Retail Display Units', 'Standees', 'Kiosks', 'Exhibition Stalls', 'POP Displays', 'Brochure Stands'],
  },
  {
    id: 'digital', name: 'Arham Digital Signages', short: 'DGS', tagline: 'We are the future…',
    color: '#0ea5e9', website: 'digitalsignages.in',
    services: ['Digital Standees', 'Touch Kiosks', 'Menu Boards', 'CMS Software', 'Video Walls (LCD)', 'Interactive Displays'],
  },
  {
    id: 'led', name: 'Arham LED', short: 'LED', tagline: 'Experience the Expertise',
    color: '#7c3aed', website: 'arhamled.com',
    services: ['Outdoor LED Video Wall', 'Indoor LED Video Wall', 'Rental LED Cabinets', 'LED Standees', 'LED Van (Mobile)', 'LED Controllers'],
  },
  {
    id: 'av', name: 'Arham AV Systems', short: 'AV', tagline: 'Audio · Video · Acoustics',
    color: '#dc2626', website: 'arhamavsystems.com',
    services: ['Boardroom AV', 'Video Conferencing', 'Auditorium Sound', 'Acoustic Design', 'Command Centre', 'Stage Lighting'],
  },
  {
    id: 'tech', name: 'Arham Technologies', short: 'TEC', tagline: 'Thoughts that make sense',
    color: '#16a34a', website: 'arham-technologies.com',
    services: ['Student Tracking (RFID)', 'Employee Attendance', 'Visitor Management', 'Canteen Management', 'Parking Management', 'Custom Software'],
  },
  {
    id: 'space', name: 'Arham Space Design', short: 'SPC', tagline: 'We create, you enjoy',
    color: '#a16207', website: 'arhamspacedesign.com',
    services: ['Office Interiors', 'Retail Showroom Interiors', 'Architecture & 3D Design', 'Project Management', 'Procurement'],
  },
  {
    id: 'studio', name: 'Arham Creative Studio', short: 'CRS', tagline: 'Discover a new you',
    color: '#059669', website: 'arhamcreativestudio.com',
    services: ['Branding & Logo', '3D Visualisation', 'Product Photography', 'Ad Films', 'Social Media Creatives'],
  },
  {
    id: 'tensile', name: 'Arham Tensile', short: 'TNS', tagline: 'Shade structures that last',
    color: '#0891b2', website: 'arhamtensile.com',
    services: ['Car Parking Tensile', 'Walkway Canopy', 'Gazebo & Umbrella', 'Facade Structures', 'Stadium Roofing'],
  },
]

export const companyById = (id: CompanyId) => COMPANIES.find(c => c.id === id)!

export const GROUP = {
  name: 'Arham World',
  subtitle: 'Group of Companies',
  website: 'www.arhamworld.in',
  address: '247/37, 3rd Cross, Ashwath Layout, Doddakallasandra Post, Bengaluru – 560062',
  phone: '+91 99458 45678',
  stats: { clients: '12,000+', offices: 13, team: 140, plants: 6 },
}
