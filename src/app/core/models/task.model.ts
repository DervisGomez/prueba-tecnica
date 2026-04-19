export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  /** `null` = sin categoría */
  categoryId: string | null;
}
