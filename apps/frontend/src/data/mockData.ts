export type JobSource = 'Company Site' | 'Glassdoor' | 'Greenhouse' | 'iCIMS' | 'Lever' | 'Workday';

export type ApplicationStatus = 'blocked' | 'offer' | 'rejected' | 'submitted';

export type ApplicationStage = 'Applied' | 'Interview' | 'Manual review' | 'Offer' | 'Rejected';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  source: JobSource;
  level: string;
  salary: string;
  matchScore: number;
  posted: string;
  tags: string[];
  saved: boolean;
  remote: boolean;
  summary: string;
}

export interface ApplicationRecord {
  id: string;
  title: string;
  company: string;
  source: JobSource;
  status: ApplicationStatus;
  stage: ApplicationStage;
  fitScore: number;
  lastUpdate: string;
  submittedDate: string;
  nextStep: string;
  owner: string;
  blocker?: string;
}

export interface ProfileDocument {
  id: string;
  name: string;
  status: string;
  updated: string;
}

export const userProfile = {
  name: 'Abraham Reay II',
  title: 'Computer Science senior',
  location: 'Attleboro, MA',
  school: 'Wentworth Institute of Technology',
  degree: 'B.S. Computer Science',
  minor: 'Data Science minor',
  graduation: 'Expected August 2026',
  targetRoles: ['Software Engineer', 'Full Stack Developer', 'Data Analyst'],
  targetLocation: 'Remote or within 100 miles',
  salaryFloor: '$60,000+',
  workAuthorization: 'Authorized to work in the U.S.',
  summary: 'Computer science student building full-stack tools, automation workflows, and data-focused web applications.',
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'C++', 'REST APIs', 'AI tooling', 'SQL', 'Java', 'Git'],
  links: [
    { label: 'GitHub', value: 'Connected' },
    { label: 'Email', value: 'Ready to connect' },
    { label: 'LinkedIn', value: 'Profile link saved' },
  ],
};

export const profileSkillGroups = [
  { label: 'Languages', skills: ['TypeScript', 'Python', 'Java', 'C++', 'SQL'] },
  { label: 'Frontend', skills: ['React', 'Vite', 'Responsive UI', 'Accessibility'] },
  { label: 'Backend and data', skills: ['Node.js', 'Express', 'PostgreSQL', 'REST APIs', 'Drizzle ORM'] },
  { label: 'Workflow tools', skills: ['GitHub', 'Codex', 'Simplify', 'ATS research', 'AI-assisted writing'] },
];

export const profileExperience = [
  {
    id: 'exp-1',
    role: 'Full-stack project developer',
    organization: 'Senior project and coursework',
    dates: '2025 - 2026',
    bullets: [
      'Built React and Node.js project surfaces with structured data models and API planning.',
      'Used job-search workflow research to define application tracking, saved jobs, and profile automation needs.',
      'Documented product requirements, risks, and MVP scope with a small project team.',
    ],
  },
  {
    id: 'exp-2',
    role: 'AI-assisted job workflow researcher',
    organization: 'RoleMatch research input',
    dates: '2026',
    bullets: [
      'Compared ATS flows across company sites, Greenhouse, Lever, Workday, iCIMS, and job boards.',
      'Identified where automation should stop for blockers such as CAPTCHA, verification codes, and user-only attestations.',
    ],
  },
  {
    id: 'exp-3',
    role: 'Software and data coursework',
    organization: 'Wentworth Institute of Technology',
    dates: '2022 - 2026',
    bullets: [
      'Applied programming, databases, data science, and software engineering concepts across class projects.',
      'Practiced technical communication through project plans, design documents, and implementation reports.',
    ],
  },
];

export const profileCoursework = [
  'Software Engineering',
  'Database Systems',
  'Data Structures',
  'Algorithms',
  'Web Development',
  'Data Science',
  'Operating Systems',
  'Computer Networks',
  'Senior Project',
];

export const profileProjects = [
  {
    id: 'project-1',
    name: 'RoleMatch',
    detail: 'Job application assistant with search, profile context, saved jobs, tracking, and future automation support.',
  },
  {
    id: 'project-2',
    name: 'Application workflow tracker',
    detail: 'Local process for tracking submitted, blocked, pending, and rejected roles across ATS systems.',
  },
  {
    id: 'project-3',
    name: 'Resume and cover letter automation research',
    detail: 'Explored how profile data and job descriptions can support tailored application materials.',
  },
];

export const profileConnections = [
  { id: 'conn-1', label: 'Primary email', value: 'abrahamii@icloud.com', status: 'Saved' },
  { id: 'conn-2', label: 'GitHub', value: 'github.com/reayiia', status: 'Connected' },
  { id: 'conn-3', label: 'LinkedIn', value: 'linkedin.com/in/abraham-reay-ii', status: 'Saved' },
  { id: 'conn-4', label: 'Indeed', value: 'Account link planned', status: 'Planned' },
  { id: 'conn-5', label: 'Glassdoor', value: 'Search source planned', status: 'Planned' },
  { id: 'conn-6', label: 'Workday', value: 'ATS adapter planned', status: 'Planned' },
];

export const profileDocuments: ProfileDocument[] = [
  { id: 'doc-1', name: 'Primary resume', status: 'Current version', updated: 'May 24' },
  { id: 'doc-2', name: 'Cover letter template', status: 'Needs review', updated: 'May 21' },
  { id: 'doc-3', name: 'Project portfolio notes', status: 'Imported', updated: 'May 19' },
];

export const jobs: JobListing[] = [
  {
    id: 'job-1',
    title: 'Junior Software Engineer',
    company: 'Northstar Systems',
    location: 'Boston, MA',
    type: 'Full time',
    source: 'Greenhouse',
    level: 'Entry level',
    salary: '$72k - $88k',
    matchScore: 94,
    posted: 'Today',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    saved: true,
    remote: false,
    summary: 'Product engineering role with React dashboards, API work, and backend data modeling.',
  },
  {
    id: 'job-2',
    title: 'Full Stack Developer',
    company: 'Aster Health',
    location: 'Remote',
    type: 'Full time',
    source: 'Lever',
    level: 'New grad',
    salary: '$68k - $82k',
    matchScore: 91,
    posted: '1 day ago',
    tags: ['TypeScript', 'Express', 'AWS'],
    saved: true,
    remote: true,
    summary: 'Build internal tools and customer workflows for a healthcare operations team.',
  },
  {
    id: 'job-3',
    title: 'Software Developer I',
    company: 'CivicData Labs',
    location: 'Providence, RI',
    type: 'Full time',
    source: 'Company Site',
    level: 'Entry level',
    salary: '$64k - $78k',
    matchScore: 88,
    posted: '2 days ago',
    tags: ['Python', 'SQL', 'Dashboards'],
    saved: false,
    remote: false,
    summary: 'Maintain data tools and automate reporting for public sector clients.',
  },
  {
    id: 'job-4',
    title: 'Associate Data Analyst',
    company: 'Waypoint Finance',
    location: 'Hybrid - Boston, MA',
    type: 'Full time',
    source: 'Workday',
    level: 'Entry level',
    salary: '$62k - $74k',
    matchScore: 84,
    posted: '3 days ago',
    tags: ['SQL', 'Python', 'Excel'],
    saved: true,
    remote: false,
    summary: 'Analyst role focused on data cleanup, recurring reports, and stakeholder dashboards.',
  },
  {
    id: 'job-5',
    title: 'Frontend Engineer',
    company: 'CanvasWorks',
    location: 'Remote',
    type: 'Full time',
    source: 'Glassdoor',
    level: 'Junior',
    salary: '$70k - $90k',
    matchScore: 82,
    posted: '4 days ago',
    tags: ['React', 'Design systems', 'Accessibility'],
    saved: false,
    remote: true,
    summary: 'Implement responsive product surfaces and improve reusable UI components.',
  },
  {
    id: 'job-6',
    title: 'Automation Engineer',
    company: 'HarborCloud',
    location: 'Cambridge, MA',
    type: 'Full time',
    source: 'iCIMS',
    level: 'Entry level',
    salary: '$66k - $79k',
    matchScore: 79,
    posted: '1 week ago',
    tags: ['APIs', 'Scripting', 'QA'],
    saved: true,
    remote: false,
    summary: 'Create test automation and workflow scripts for a cloud operations platform.',
  },
];

export const applications: ApplicationRecord[] = [
  {
    id: 'app-1',
    title: 'Junior Software Engineer',
    company: 'Northstar Systems',
    source: 'Greenhouse',
    status: 'submitted',
    stage: 'Applied',
    fitScore: 94,
    lastUpdate: 'May 27',
    submittedDate: 'May 26',
    nextStep: 'Watch for confirmation email',
    owner: 'Abe',
  },
  {
    id: 'app-2',
    title: 'Full Stack Developer',
    company: 'Aster Health',
    source: 'Lever',
    status: 'submitted',
    stage: 'Applied',
    fitScore: 91,
    lastUpdate: 'May 27',
    submittedDate: 'May 27',
    nextStep: 'Watch for confirmation email',
    owner: 'Abe',
  },
  {
    id: 'app-3',
    title: 'Associate Data Analyst',
    company: 'Waypoint Finance',
    source: 'Workday',
    status: 'submitted',
    stage: 'Interview',
    fitScore: 84,
    lastUpdate: 'May 25',
    submittedDate: 'May 22',
    nextStep: 'Prepare notes for recruiter screen',
    owner: 'Team',
  },
  {
    id: 'app-4',
    title: 'Automation Engineer',
    company: 'HarborCloud',
    source: 'iCIMS',
    status: 'blocked',
    stage: 'Manual review',
    fitScore: 79,
    lastUpdate: 'May 24',
    submittedDate: 'Not submitted',
    nextStep: 'Manual CAPTCHA review',
    owner: 'Abe',
    blocker: 'Application page requires manual verification before submission.',
  },
  {
    id: 'app-5',
    title: 'Frontend Engineer',
    company: 'CanvasWorks',
    source: 'Glassdoor',
    status: 'rejected',
    stage: 'Rejected',
    fitScore: 82,
    lastUpdate: 'May 21',
    submittedDate: 'May 18',
    nextStep: 'Archive after email sync',
    owner: 'Abe',
  },
];
