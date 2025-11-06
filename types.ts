
export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  steps: Step[];
}
