const fs = require('fs');
const path = require('path');

const files = [
    "src/components/dashboard/SleepCard.tsx",
    "src/components/dashboard/PushupRadial.tsx",
    "src/components/dashboard/FocusCard.tsx",
    "src/components/dashboard/DashboardHeader.tsx",
    "src/components/dashboard/Dashboard.tsx",
    "src/components/dashboard/WeeklySummary.tsx",
    "src/components/dashboard/WellnessCard.tsx",
    "src/components/dashboard/TasksCard.tsx",
    "src/components/tasks/TasksPage.tsx",
    "src/components/focus/FocusPage.tsx",
    "src/components/ui/empty-state.tsx",
    "src/components/habits/HabitsPage.tsx",
    "src/components/tasks/TaskItem.tsx",
    "src/components/sleep/SleepPage.tsx"
];

for (const rel of files) {
    const p = path.join("/home/binhdt/life-os", rel);
    let content = fs.readFileSync(p, 'utf8');

    // Replace import
    content = content.replace(/import\s*\{\s*motion\s*\}\s*from\s*"framer-motion"/g, 'import { m } from "framer-motion"');
    content = content.replace(/import\s*\{\s*motion\s*,\s*(.*?)\}\s*from\s*"framer-motion"/g, 'import { m, $1} from "framer-motion"');

    // Replace JSX tags
    content = content.replace(/<motion\./g, '<m.');
    content = content.replace(/<\/motion\./g, '</m.');
    content = content.replace(/motion\(/g, 'm(');

    fs.writeFileSync(p, content, 'utf8');
    console.log(`Updated ${rel}`);
}
