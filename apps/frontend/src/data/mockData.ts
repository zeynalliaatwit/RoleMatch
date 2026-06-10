export type JobSource = 'Company Site' | 'Glassdoor' | 'Greenhouse' | 'iCIMS' | 'Lever' | 'Workday';

export type ApplicationStatus = 'blocked' | 'interview' | 'offer' | 'rejected' | 'submitted';

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
  name: 'RoleMatch user',
  title: 'Profile setup',
  location: 'Location not set',
  targetRoles: ['Software Engineer', 'Full Stack Developer', 'Data Analyst'],
  targetLocation: 'Remote or within 100 miles',
  salaryFloor: '$60,000+',
  workAuthorization: 'Authorized to work in the U.S.',
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'C++', 'REST APIs', 'AI tooling'],
  links: [
    { label: 'GitHub', value: 'Connected' },
    { label: 'Email', value: 'Ready to connect' },
    { label: 'LinkedIn', value: 'Profile link saved' },
  ],
};

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
    fitScore: 94,
    lastUpdate: 'May 27',
    submittedDate: 'May 26',
    nextStep: 'Watch for confirmation email',
    owner: 'User',
  },
  {
    id: 'app-2',
    title: 'Full Stack Developer',
    company: 'Aster Health',
    source: 'Lever',
    status: 'submitted',
    fitScore: 91,
    lastUpdate: 'May 27',
    submittedDate: 'May 27',
    nextStep: 'Watch for confirmation email',
    owner: 'User',
  },
  {
    id: 'app-3',
    title: 'Associate Data Analyst',
    company: 'Waypoint Finance',
    source: 'Workday',
    status: 'interview',
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
    fitScore: 79,
    lastUpdate: 'May 24',
    submittedDate: 'Not submitted',
    nextStep: 'Manual CAPTCHA review',
    owner: 'User',
    blocker: 'Application page requires manual verification before submission.',
  },
  {
    id: 'app-5',
    title: 'Software Developer I',
    company: 'CivicData Labs',
    source: 'Company Site',
    status: 'submitted',
    fitScore: 88,
    lastUpdate: 'May 23',
    submittedDate: 'May 23',
    nextStep: 'Watch for confirmation email',
    owner: 'User',
  },
  {
    id: 'app-6',
    title: 'Frontend Engineer',
    company: 'CanvasWorks',
    source: 'Glassdoor',
    status: 'rejected',
    fitScore: 82,
    lastUpdate: 'May 21',
    submittedDate: 'May 18',
    nextStep: 'Archive after email sync',
    owner: 'User',
  },
];
