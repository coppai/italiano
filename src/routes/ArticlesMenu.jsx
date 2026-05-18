import PageShell from '../components/layout/PageShell.jsx';
import Header from '../components/layout/Header.jsx';
import BackLink from '../components/layout/BackLink.jsx';
import MenuGrid from '../components/layout/MenuGrid.jsx';
import MenuCard from '../components/layout/MenuCard.jsx';

export default function ArticlesMenu() {
  return (
    <PageShell variant="index">
      <Header title="📰 Italian Article Drills" subtitle="Choose an article practice mode" />
      <MenuGrid>
        <MenuCard
          to="/articles/definite"
          title="Definite Articles"
          description="Practice choosing the correct definite article (il, lo, la, l') for Italian nouns."
          stats={[
            { label: '100', value: 'words' },
            { label: 'Level:', value: 'Beginner' },
          ]}
        />
        <MenuCard
          to="/articles/indefinite"
          title="Indefinite Articles"
          description="Practice choosing the correct indefinite article (un, uno, una, un') for Italian nouns."
          stats={[
            { label: '100', value: 'words' },
            { label: 'Level:', value: 'Beginner' },
          ]}
        />
        <MenuCard
          to="/articles/plural"
          title="Plural Definite Articles"
          description="Practice choosing the correct plural definite article (i, gli, le) for Italian nouns."
          stats={[
            { label: '100', value: 'words' },
            { label: 'Level:', value: 'Beginner' },
          ]}
        />
        <MenuCard
          to="/articles/plural-endings"
          title="Plural Word Endings"
          description="Practice completing the correct plural ending for Italian nouns."
          stats={[
            { label: '50', value: 'words' },
            { label: 'Level:', value: 'Intermediate' },
          ]}
        />
        <MenuCard
          to="/articles/partitive"
          title="Partitive Articles"
          description="Practice choosing the correct partitive article (del, dello, della, dei, degli, delle, dell') for Italian nouns."
          stats={[
            { label: '100', value: 'words' },
            { label: 'Level:', value: 'Intermediate' },
          ]}
        />
        <MenuCard
          to="/articles/stats"
          title="📊 Article Stats"
          description="View your article practice statistics with sortable performance metrics to track your progress."
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
