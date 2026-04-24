import { Kanban, BookOpen, Sparkles, MousePointer2 } from "lucide-react";

export function AboutContent() {
  const sections = [
    {
      title: "What is Kanban?",
      icon: <Kanban className="h-6 w-6 text-zinc-500" />,
      content: "Kanban (Japanese for 'visual signal' or 'card') is a lean workflow management method for defining, managing, and improving services that deliver knowledge work. It helps you visualize your work, maximize efficiency, and be agile."
    },
    {
      title: "How to Use the Board",
      icon: <MousePointer2 className="h-6 w-6 text-zinc-500" />,
      content: "Simply drag and drop cards to move them between different stages of your workflow. You can also drag entire lists to reorder them. Click on a card to view or edit its detailed description and tags."
    },
    {
      title: "Key Features",
      icon: <Sparkles className="h-6 w-6 text-zinc-500" />,
      list: [
        "Interactive Drag-and-Drop for both Cards and Lists.",
        "Real-time state synchronization using TanStack Query.",
        "Optimistic UI updates for a zero-latency feel.",
        "Full support for Dark and Light themes.",
        "Clean, glassmorphic design for maximum focus."
      ]
    },
    {
      title: "Quick Start Guide",
      icon: <BookOpen className="h-6 w-6 text-zinc-500" />,
      content: "Start by creating a few lists (e.g., 'To Do', 'In Progress', 'Done'). Add cards for your tasks and move them as you progress. Use the search bar (coming soon) and tags to keep your board organized."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
      {sections.map((section, index) => (
        <section 
          key={index} 
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {section.icon}
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {section.title}
            </h2>
          </div>
          
          {section.content && (
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg pl-1">
              {section.content}
            </p>
          )}

          {section.list && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
              {section.list.map((item, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 shrink-0" />
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
