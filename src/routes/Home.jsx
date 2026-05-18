import PageShell from '../components/layout/PageShell.jsx';
import Header from '../components/layout/Header.jsx';
import MenuGrid from '../components/layout/MenuGrid.jsx';
import MenuCard from '../components/layout/MenuCard.jsx';

export default function Home() {
  return (
    <PageShell variant="index">
      <Header title="Italian Practice Drills" subtitle="Choose a drill to start practicing" />
      <MenuGrid>
        <MenuCard
          to="/articles"
          title="📰 Articles"
          description="Practice Italian definite, indefinite, plural, and partitive articles with detailed statistics tracking."
          stats={[
            { label: '6', value: 'drill types' },
            { label: 'Level:', value: 'Beginner–Intermediate' },
          ]}
        />
        <MenuCard
          to="/flashcards"
          title="Vocab Flashcards"
          description="Practice with custom flashcards. Click to flip and reveal answers!"
          stats={[
            { label: 'Custom', value: 'cards' },
            { label: 'Level:', value: 'All Levels' },
          ]}
        />
        <MenuCard
          to="/verbs"
          title="🔤 Verbs"
          description="Practice Italian verb conjugations, infinitives, and track your progress with detailed statistics."
          stats={[
            { label: '3', value: 'drill types' },
            { label: 'Level:', value: 'Beginner–Intermediate' },
          ]}
        />
        <MenuCard
          to="/possessives"
          title="🤝 Possessives"
          description="Master Italian possessive adjectives (my, your, his/her, our, your, their) with gender and number agreement."
          stats={[
            { label: '40+', value: 'exercises' },
            { label: 'Level:', value: 'Beginner–Intermediate' },
          ]}
        />
      </MenuGrid>
    </PageShell>
  );
}
