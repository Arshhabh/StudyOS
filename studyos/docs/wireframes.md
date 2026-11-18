# StudyOS wireframes

## Desktop dashboard

```text
┌─────────────────┬──────────────────────────────────────────────────┐
│ StudyOS         │ Workspace › Dashboard           Search  Sun Bell │
│                 ├──────────────────────────────────────────────────┤
│ WORKSPACE       │ Dashboard                                  Clock │
│ Dashboard       │ ┌──────────────────────────────────────────────┐ │
│ Calendar        │ │ Date                  Illustrated study desk │ │
│ Tasks           │ │ Welcome, first name                          │ │
│ Notes           │ │ Daily quote                                  │ │
│                 │ │ [Start focus session] [Add task]             │ │
│ ACADEMICS       │ └──────────────────────────────────────────────┘ │
│ Assignments     │ [Study time] [Tasks] [Streak] [Productivity]     │
│ Exams           │ ┌─────────────────────────┐ ┌─────────────────┐ │
│ Goals           │ │ Today’s agenda          │ │ Focus timer     │ │
│                 │ │ Time · Item · Category  │ │ Mode selector   │ │
│ PRODUCTIVITY    │ │ Time · Item · Category  │ │ Countdown ring  │ │
│ Focus timer     │ │ Time · Item · Category  │ │ Start and reset │ │
│ Habits          │ │ Add to agenda           │ │ Session count   │ │
│ Analytics       │ └─────────────────────────┘ └─────────────────┘ │
│                 │ [Study activity chart]      [Upcoming deadlines]│
│ Study assistant │ [Daily habits]                                  │
│ Student tools   │                                                 │
│ Settings        │                                                 │
│ Student profile │                                                 │
└─────────────────┴──────────────────────────────────────────────────┘
```

## Mobile dashboard

```text
┌────────────────────────────┐
│ Menu  Dashboard  Find Bell │
│ Dashboard            Clock │
│ Welcome card + desk art    │
│ [Start focus] [Add task]   │
│ [Study time] [Tasks]       │
│ [Streak]     [Score]       │
│ Today's agenda             │
│ Focus timer                │
│ Study activity             │
│ Upcoming deadlines         │
│ Habits                     │
└────────────────────────────┘
```

## Academic planning flow

Navigate from the sidebar or command palette to Assignments or Exams. Search and subject filters narrow the cards. Selecting a card opens the editor. Saving updates the local collection, calendar, notifications, and charts. An authenticated workspace queues the change for cloud synchronization.

```text
Assignments                               [New assignment]
[Search coursework] [All subjects] [Status or priority]
┌─────────────────────┐   ┌─────────────────────┐
│ Subject · Countdown │   │ Subject · Countdown │
│ Assignment title    │   │ Assignment title    │
│ Notes and due date  │   │ Notes and due date  │
│ Status       [Edit] │   │ Status       [Edit] │
└─────────────────────┘   └─────────────────────┘
```

## Focus and notes

The full Focus timer page pairs an adjustable timer with session history. Timer settings include focus length, break lengths, auto-break, and sound. Notes pairs a subject-filtered note list with an autosaving editor and Markdown preview. Both layouts stack vertically on small screens.
