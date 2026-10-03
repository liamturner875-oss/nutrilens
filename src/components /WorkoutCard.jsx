import React from 'react';

export default function WorkoutCard({ title, exercises = [], duration, difficulty, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg tracking-tight">{title || 'Workout Session'}</h3>
        {difficulty && (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            {difficulty}
          </span>
        )}
      </div>
      
      {exercises.length > 0 ? (
        <ul className="space-y-1 text-sm text-muted-foreground mb-4">
          {exercises.slice(0, 3).map((ex, i) => (
            <li key={i} className="truncate">• {ex.name || ex}</li>
          ))}
          {exercises.length > 3 && <li className="text-xs italic">+ {exercises.length - 3} more exercises</li>}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic mb-4">No exercises added yet.</p>
      )}

      {duration && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>⏱️ {duration} mins</span>
        </div>
      )}
    </div>
  );
}
