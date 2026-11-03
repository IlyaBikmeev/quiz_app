import { useParams } from 'react-router-dom';
import { QuizEditor } from '../components/QuizEditor';

export function QuizEditPage() {
  const { id } = useParams();
  return <QuizEditor quizId={id} />;
}
