import PageShell from '../components/layout/PageShell.jsx';
import Header from '../components/layout/Header.jsx';
import BackLink from '../components/layout/BackLink.jsx';
import MenuGrid from '../components/layout/MenuGrid.jsx';
import MenuCard from '../components/layout/MenuCard.jsx';

export default function VerbsMenu() {
  return (
    <PageShell variant="index">
      <Header title="🔤 Italian Verb Drills" subtitle="Choose a verb practice mode" />
      <MenuGrid>
        <MenuCard
          to="/verbs/conjugation"
          title="Verb Conjugation"
          description="Practice conjugating the most common Italian verbs in the present tense with flashcard-style correct/incorrect tracking."
          stats={[
            { label: '25', value: 'verbs (150 forms)' },
            { label: 'Level:', value: 'Beginner–Intermediate' },
          ]}
        />
        <MenuCard
          to="/verbs/infinitive"
          title="Verb Infinitives"
          description="Practice recognizing Italian verb infinitives. Match the conjugated form to its infinitive."
          stats={[
            { label: '25', value: 'verbs' },
            { label: 'Level:', value: 'Beginner' },
          ]}
        />
        <MenuCard
          to="/verbs/deep-dive"
          title="Verb Deep Dive"
          description="Drill every form of one verb at a time — gerund, present, imperfetto, and passato prossimo — then move on to the next."
          stats={[
            { label: '12', value: 'verbs (19 cards each)' },
            { label: 'Level:', value: 'Intermediate' },
          ]}
        />
        <MenuCard
          to="/verbs/stats"
          title="📊 Verb Stats"
          description="View your verb conjugation practice statistics with sortable performance metrics and focused practice mode."
          stats={[
            { label: 'Track', value: 'progress' },
            { label: 'Level:', value: 'All Levels' },
          ]}
        />
      </MenuGrid>
      <BackLink />
    </PageShell>
  );
}
