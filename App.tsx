
import React, { useState, useMemo, useCallback } from 'react';
import { Goal, Step } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { suggestStepsForGoal } from './services/geminiService';

// --- Icon Components ---
const PlusIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.58 2.25 6.67 3.204 6.67 4.384v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const SparklesIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

// --- UI Components ---

interface GoalFormProps {
    onAddGoal: (title: string) => void;
}
const GoalForm: React.FC<GoalFormProps> = ({ onAddGoal }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddGoal(title.trim());
            setTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Cuál es tu próxima gran meta?"
                className="flex-grow bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200"
            />
            <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-5 rounded-lg transition duration-200 flex items-center gap-2 disabled:bg-sky-800 disabled:cursor-not-allowed"
                disabled={!title.trim()}
            >
                <PlusIcon className="w-5 h-5" />
                <span>Añadir Meta</span>
            </button>
        </form>
    );
};

interface ProgressBarProps {
    progress: number;
}
const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};


interface StepItemProps {
    step: Step;
    onToggle: () => void;
}
const StepItem: React.FC<StepItemProps> = ({ step, onToggle }) => {
    return (
        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-700/50 rounded-md transition-colors">
            <input
                type="checkbox"
                checked={step.completed}
                onChange={onToggle}
                className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-600"
            />
            <span className={`flex-1 ${step.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                {step.text}
            </span>
        </label>
    );
};

interface GoalCardProps {
    goal: Goal;
    onDelete: (id: string) => void;
    onToggleStep: (goalId: string, stepId: string) => void;
    onUpdateGoal: (updatedGoal: Goal) => void;
}
const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete, onToggleStep, onUpdateGoal }) => {
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const progress = useMemo(() => {
        if (goal.steps.length === 0) return 0;
        const completedSteps = goal.steps.filter(step => step.completed).length;
        return (completedSteps / goal.steps.length) * 100;
    }, [goal.steps]);
    
    const handleSuggestSteps = async () => {
        setIsLoadingAi(true);
        setError(null);
        try {
            const suggestedStepTexts = await suggestStepsForGoal(goal.title);
            const newSteps: Step[] = suggestedStepTexts.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed: false,
            }));
            const updatedGoal = { ...goal, steps: [...goal.steps, ...newSteps] };
            onUpdateGoal(updatedGoal);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocurrió un error desconocido.");
            }
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    return (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700/50">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                <button
                    onClick={() => onDelete(goal.id)}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                    aria-label={`Eliminar meta: ${goal.title}`}
                >
                    <TrashIcon />
                </button>
            </div>
            
            <div className="mb-4">
                <ProgressBar progress={progress} />
            </div>

            <div className="space-y-2 mb-4">
                {goal.steps.map(step => (
                    <StepItem key={step.id} step={step} onToggle={() => onToggleStep(goal.id, step.id)} />
                ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            
            <div className="flex justify-end">
                <button 
                    onClick={handleSuggestSteps}
                    disabled={isLoadingAi}
                    className="bg-sky-700 hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-wait text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
                >
                    <SparklesIcon />
                    {isLoadingAi ? 'Pensando...' : 'Sugerir Pasos con IA'}
                </button>
            </div>
        </div>
    );
};

interface GoalListProps {
    goals: Goal[];
    onDelete: (id: string) => void;
    onToggleStep: (goalId: string, stepId: string) => void;
    onUpdateGoal: (updatedGoal: Goal) => void;
}
const GoalList: React.FC<GoalListProps> = ({ goals, onDelete, onToggleStep, onUpdateGoal }) => {
    return (
        <div className="space-y-4">
            {goals.map(goal => (
                <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onDelete={onDelete}
                    onToggleStep={onToggleStep}
                    onUpdateGoal={onUpdateGoal}
                />
            ))}
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const [goals, setGoals] = useLocalStorage<Goal[]>('ai-goals', []);

    const handleAddGoal = useCallback((title: string) => {
        const newGoal: Goal = {
            id: crypto.randomUUID(),
            title,
            steps: [],
        };
        setGoals(prevGoals => [newGoal, ...prevGoals]);
    }, [setGoals]);

    const handleDeleteGoal = useCallback((id: string) => {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
    }, [setGoals]);

    const handleToggleStep = useCallback((goalId: string, stepId: string) => {
        setGoals(prevGoals => prevGoals.map(goal => {
            if (goal.id === goalId) {
                return {
                    ...goal,
                    steps: goal.steps.map(step => 
                        step.id === stepId ? { ...step, completed: !step.completed } : step
                    )
                };
            }
            return goal;
        }));
    }, [setGoals]);

    const handleUpdateGoal = useCallback((updatedGoal: Goal) => {
        setGoals(prevGoals => prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    }, [setGoals]);

    return (
        <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                <header className="text-center my-8 md:my-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                        Establecedor de Metas con IA
                    </h1>
                    <p className="mt-4 text-lg text-slate-400">
                        Define tus ambiciones. Deja que la IA te ayude a conquistarlas.
                    </p>
                </header>

                <main>
                    <GoalForm onAddGoal={handleAddGoal} />
                    {goals.length > 0 ? (
                       <GoalList 
                            goals={goals} 
                            onDelete={handleDeleteGoal}
                            onToggleStep={handleToggleStep}
                            onUpdateGoal={handleUpdateGoal}
                        />
                    ) : (
                        <div className="text-center py-16 px-6 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl">
                            <h2 className="text-2xl font-semibold text-white">¡Aún no hay metas!</h2>
                            <p className="mt-2 text-slate-400">¿Qué quieres lograr? Añade tu primera meta para empezar.</p>
                        </div>
                    )}
                </main>

                <footer className="text-center mt-12 text-slate-500 text-sm">
                    <p>Desarrollado con React, Tailwind CSS y la API de Gemini</p>
                </footer>
            </div>
        </div>
    );
};

export default App;