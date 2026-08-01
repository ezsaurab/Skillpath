// Curated learning tracks. Each track maps an interest to YouTube videos and
// practice questions. Videos are tagged with levels so we can filter by the
// student's chosen experience level.

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export const tracks = [
  {
    id: 'web',
    name: 'Web Development',
    emoji: '🌐',
    blurb: 'Build websites and web apps with HTML, CSS, JavaScript and React.',
    videos: [
      {
        title: 'HTML Full Course for Beginners',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        levels: ['Beginner'],
      },
      {
        title: 'CSS Crash Course For Absolute Beginners',
        channel: 'Traversy Media',
        url: 'https://www.youtube.com/watch?v=yfoY53QXEnI',
        levels: ['Beginner'],
      },
      {
        title: 'JavaScript Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        levels: ['Beginner', 'Intermediate'],
      },
      {
        title: 'React Course - Beginner to Advanced',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        levels: ['Intermediate', 'Advanced'],
      },
    ],
    questions: [
      {
        q: 'Which HTML tag creates the largest top-level heading?',
        options: ['<head>', '<h1>', '<h6>', '<header>'],
        answer: 1,
        explain: '<h1> is the highest-level heading; <h6> is the smallest.',
      },
      {
        q: 'In CSS, which property changes the text color?',
        options: ['font-color', 'text-style', 'color', 'background'],
        answer: 2,
        explain: 'The `color` property sets the foreground (text) color.',
      },
      {
        q: 'What does the JavaScript `===` operator check?',
        options: [
          'Value only',
          'Value and type',
          'Reference only',
          'Assignment',
        ],
        answer: 1,
        explain: '`===` is strict equality — it compares both value and type.',
      },
      {
        q: 'In React, what is used to pass data from a parent to a child component?',
        options: ['state', 'props', 'hooks', 'context only'],
        answer: 1,
        explain: 'Props are read-only inputs passed from parent to child.',
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Science',
    emoji: '📊',
    blurb: 'Analyze data and find insights with Python, Pandas and statistics.',
    videos: [
      {
        title: 'Python for Data Science - Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI',
        levels: ['Beginner'],
      },
      {
        title: 'Data Analysis with Python - Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
        levels: ['Beginner', 'Intermediate'],
      },
      {
        title: 'Statistics - A Full University Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=xxpc-HPKN28',
        levels: ['Intermediate', 'Advanced'],
      },
    ],
    questions: [
      {
        q: 'Which Python library is most commonly used for tabular data analysis?',
        options: ['NumPy', 'Pandas', 'Requests', 'Flask'],
        answer: 1,
        explain: 'Pandas provides DataFrames, the standard tabular structure.',
      },
      {
        q: 'The "mean" of a dataset is its:',
        options: ['Middle value', 'Most frequent value', 'Average', 'Range'],
        answer: 2,
        explain: 'Mean = sum of values divided by count (the average).',
      },
      {
        q: 'Which chart best shows the relationship between two numeric variables?',
        options: ['Pie chart', 'Scatter plot', 'Bar chart', 'Histogram'],
        answer: 1,
        explain: 'A scatter plot reveals correlation between two numeric values.',
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    emoji: '🤖',
    blurb: 'Teach computers to learn from data with ML and neural networks.',
    videos: [
      {
        title: 'Machine Learning for Everybody - Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
        levels: ['Beginner'],
      },
      {
        title: 'But what is a Neural Network?',
        channel: '3Blue1Brown',
        url: 'https://www.youtube.com/watch?v=aircAruvnKk',
        levels: ['Beginner', 'Intermediate'],
      },
      {
        title: 'PyTorch for Deep Learning - Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=V_xro1bcAuA',
        levels: ['Intermediate', 'Advanced'],
      },
    ],
    questions: [
      {
        q: 'Supervised learning requires data that is:',
        options: ['Unlabeled', 'Labeled', 'Encrypted', 'Streaming'],
        answer: 1,
        explain: 'Supervised models learn from labeled input→output examples.',
      },
      {
        q: 'Which of these is a classification problem?',
        options: [
          'Predicting house price',
          'Predicting tomorrow\'s temperature',
          'Detecting spam vs not-spam email',
          'Estimating a person\'s age',
        ],
        answer: 2,
        explain: 'Spam detection sorts items into discrete classes.',
      },
      {
        q: 'What is "overfitting"?',
        options: [
          'Model memorizes training data and fails on new data',
          'Model is too simple',
          'Training is too slow',
          'Data has no labels',
        ],
        answer: 0,
        explain: 'An overfit model fits noise and generalizes poorly.',
      },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile App Development',
    emoji: '📱',
    blurb: 'Build iOS and Android apps with React Native or Flutter.',
    videos: [
      {
        title: 'React Native Course for Beginners',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        levels: ['Beginner', 'Intermediate'],
      },
      {
        title: 'Flutter Course - Full Tutorial',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=VPvVD8t02U8',
        levels: ['Beginner', 'Intermediate'],
      },
    ],
    questions: [
      {
        q: 'React Native lets you build mobile apps using which language?',
        options: ['Swift', 'Kotlin', 'JavaScript', 'Dart'],
        answer: 2,
        explain: 'React Native uses JavaScript/JSX; Flutter uses Dart.',
      },
      {
        q: 'Flutter apps are written in which language?',
        options: ['Dart', 'Java', 'Python', 'C#'],
        answer: 0,
        explain: 'Flutter uses Dart, created by Google.',
      },
    ],
  },
  {
    id: 'design',
    name: 'UI / UX Design',
    emoji: '🎨',
    blurb: 'Design beautiful, usable interfaces with Figma and design principles.',
    videos: [
      {
        title: 'UI / UX Design Tutorial for Beginners',
        channel: 'AJ&Smart',
        url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
        levels: ['Beginner'],
      },
      {
        title: 'Figma UI Design Tutorial',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
        levels: ['Beginner', 'Intermediate'],
      },
    ],
    questions: [
      {
        q: 'What does "UX" stand for?',
        options: [
          'User Experience',
          'User Extension',
          'Universal X-ray',
          'Unified Examples',
        ],
        answer: 0,
        explain: 'UX = User Experience: how a product feels to use.',
      },
      {
        q: 'Which principle keeps related elements grouped together?',
        options: ['Contrast', 'Proximity', 'Animation', 'Saturation'],
        answer: 1,
        explain: 'Proximity groups related items so users perceive structure.',
      },
    ],
  },
  {
    id: 'security',
    name: 'Cybersecurity',
    emoji: '🔐',
    blurb: 'Protect systems, learn networking, and explore ethical hacking.',
    videos: [
      {
        title: 'Cyber Security Full Course for Beginners',
        channel: 'Edureka',
        url: 'https://www.youtube.com/watch?v=U_P23SqJaDc',
        levels: ['Beginner'],
      },
      {
        title: 'Ethical Hacking Full Course',
        channel: 'freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=3Kq1MIfTWCE',
        levels: ['Intermediate', 'Advanced'],
      },
    ],
    questions: [
      {
        q: 'What does "HTTPS" add over plain HTTP?',
        options: [
          'Faster speed',
          'Encryption (TLS)',
          'More storage',
          'Better SEO only',
        ],
        answer: 1,
        explain: 'HTTPS encrypts traffic using TLS, protecting data in transit.',
      },
      {
        q: 'A "phishing" attack tries to:',
        options: [
          'Overload a server',
          'Trick users into revealing credentials',
          'Encrypt files for ransom',
          'Scan open ports',
        ],
        answer: 1,
        explain: 'Phishing deceives users into giving up sensitive info.',
      },
    ],
  },
]

// Search queries used to fetch live, ranked videos from the backend.
export const trackQuery = {
  web: 'web development full course for beginners',
  data: 'data science full course',
  ai: 'machine learning full course',
  mobile: 'app development course react native flutter',
  design: 'ui ux design full course',
  security: 'cyber security ethical hacking full course',
}

export const trackById = (id) => tracks.find((t) => t.id === id)
