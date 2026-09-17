/**
 * Stratus content model
 * ---------------------------------------------------------------------------
 * All learning content is plain, typed data. UI components render it; they never
 * contain lesson text. This keeps content reviewable, testable (see
 * src/content/__tests__) and easy to extend with new modules.
 *
 * Inline text fields support a tiny, safe markdown subset (see InlineText):
 *   **bold**   *emphasis*   `code`   [[concept-id]]   [[concept-id|label]]
 *   [label](https://external)   [label](/internal/route)
 */

export type DomainId = 'identity-governance' | 'storage' | 'compute' | 'networking' | 'monitoring';
export type AreaId = DomainId | 'foundations';

/** How central a topic is to the AZ-104 exam. */
export type ExamTier = 'must' | 'should' | 'advanced';

/** Difficulty progression used across lessons, questions and labs. */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;
export const LEVEL_NAMES: Record<Level, { name: string; question: string }> = {
  1: { name: 'Understand', question: 'What is this?' },
  2: { name: 'Configure', question: 'How do I set it up?' },
  3: { name: 'Apply', question: 'When should I use it?' },
  4: { name: 'Troubleshoot', question: 'What happens when it fails?' },
  5: { name: 'Design', question: 'How does it fit a larger solution?' },
  6: { name: 'Exam mastery', question: 'Can I solve a hard AZ-104 scenario?' },
};

export type ISODate = string; // YYYY-MM-DD

// ---------------------------------------------------------------------------
// Sources & freshness
// ---------------------------------------------------------------------------

export interface Source {
  id: string;
  title: string;
  url: string;
  publisher: 'Microsoft Learn' | 'Microsoft Azure Updates';
  /** Date the Microsoft page itself was last updated (as shown in its metadata). */
  pageUpdated?: ISODate;
  /** Date Stratus last verified content against this page. */
  verified: ISODate;
}

export interface ChangeNote {
  topic: string;
  previously: string;
  now: string;
  matters: string;
}

// ---------------------------------------------------------------------------
// Exam outline
// ---------------------------------------------------------------------------

export interface Skill {
  id: string;
  text: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  skills: Skill[];
}

export interface ExamDomain {
  id: DomainId;
  title: string;
  shortTitle: string;
  weight: { min: number; max: number };
  groups: SkillGroup[];
}

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

export interface LessonMeta {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  /** Highest level the lesson takes the learner to. */
  level: Level;
  tier: ExamTier;
  skills: string[];
  concepts: string[];
  keywords?: string[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: LessonMeta[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  tagline: string;
  summary: string;
  area: AreaId;
  domains: DomainId[];
  icon: IconKey;
  /** One-paragraph mental model the module builds. */
  mentalModel: string;
  outcomes: string[];
  chapters: Chapter[];
}

export type SectionKind =
  | 'intro'
  | 'why'
  | 'explain'
  | 'visual'
  | 'how'
  | 'example'
  | 'configure'
  | 'compare'
  | 'decide'
  | 'mistakes'
  | 'troubleshoot'
  | 'connections'
  | 'scenario'
  | 'challenge'
  | 'exam';

export interface Section {
  id: string;
  kind: SectionKind;
  title?: string;
  blocks: Block[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  sections: Section[];
  takeaways: string[];
  interview?: { q: string; a: string }[];
  changes?: ChangeNote[];
  sources: string[];
  verified: ISODate;
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

export type CodeLang = 'bash' | 'powershell' | 'json' | 'bicep' | 'kusto' | 'text';

export interface CodeTab {
  lang: CodeLang;
  label: string;
  code: string;
  /** Short explanations for important tokens/parameters. */
  notes?: { token: string; note: string }[];
}

export type CalloutVariant = 'tip' | 'note' | 'warning' | 'trap' | 'real-world' | 'exam' | 'analogy';

export interface DecisionOption {
  label: string;
  next: string;
}

export type DecisionNode =
  | { kind: 'question'; text: string; help?: string; options: DecisionOption[] }
  | { kind: 'result'; title: string; text: string; tone?: 'good' | 'caution'; concepts?: string[] };

export interface DecisionTree {
  id: string;
  title: string;
  start: string;
  nodes: Record<string, DecisionNode>;
}

export type AdminQuestionId =
  | 'goal'
  | 'service'
  | 'security'
  | 'network'
  | 'access'
  | 'governance'
  | 'monitoring'
  | 'backup'
  | 'failure'
  | 'cost';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'lead'; text: string }
  | { type: 'explainer'; technical: string[]; simple: string[] }
  | { type: 'analogy'; title: string; story: string; mapping: { analogy: string; azure: string }[] }
  | { type: 'callout'; variant: CalloutVariant; title?: string; text: string }
  | { type: 'change'; note: ChangeNote }
  | { type: 'list'; style?: 'bullet' | 'check' | 'number'; items: string[] }
  | { type: 'steps'; title?: string; steps: { title: string; detail?: string }[] }
  | { type: 'table'; caption?: string; columns: string[]; rows: string[][] }
  | { type: 'code'; title?: string; tabs: CodeTab[] }
  | {
      type: 'portal';
      title: string;
      path: string[];
      steps: { label: string; detail?: string; fields?: { name: string; value: string; hint?: string }[] }[];
    }
  | { type: 'diagram'; id: string; props?: Record<string, unknown>; caption?: string; alt: string }
  | { type: 'flow'; title?: string; spec: DiagramSpec; caption?: string; alt: string }
  | { type: 'interactive'; id: string; props?: Record<string, unknown>; title?: string; intro?: string }
  | { type: 'decision'; tree: DecisionTree }
  | { type: 'mistakes'; items: { mistake: string; fix: string }[] }
  | {
      type: 'scenario';
      company: string;
      context: string;
      problem: string;
      approach: string[];
      outcome?: string;
    }
  | { type: 'compare'; title?: string; items: { name: string; bestFor: string; points: string[] }[] }
  | { type: 'quickcheck'; questionIds: string[] }
  | { type: 'adminLens'; answers: { q: AdminQuestionId; a: string }[] }
  | { type: 'connections'; conceptId: string };

// ---------------------------------------------------------------------------
// Knowledge graph
// ---------------------------------------------------------------------------

export type RelationKind =
  | 'dependsOn'
  | 'integratesWith'
  | 'security'
  | 'networking'
  | 'monitoring'
  | 'governance'
  | 'contains'
  | 'partOf'
  | 'alternative';

export const RELATION_LABELS: Record<RelationKind, string> = {
  dependsOn: 'Depends on',
  integratesWith: 'Integrates with',
  security: 'Security & access',
  networking: 'Networking',
  monitoring: 'Monitoring',
  governance: 'Governance',
  contains: 'Contains',
  partOf: 'Part of',
  alternative: 'Alternatives',
};

export interface Edge {
  to: string;
  label?: string;
}

export interface Concept {
  id: string;
  name: string;
  aliases?: string[];
  area: AreaId;
  kind: 'service' | 'feature' | 'resource' | 'principle' | 'tool' | 'role' | 'setting';
  tier: ExamTier;
  /** What is it? One sentence. */
  summary: string;
  /** Explain it like I'm new to Azure. */
  simple: string;
  /** Why does it exist / what problem does it solve? */
  why: string;
  useWhen?: string[];
  avoidWhen?: string[];
  relations: Partial<Record<RelationKind, Edge[]>>;
  confusedWith?: { id: string; difference: string }[];
  cost?: string[];
  troubleshooting?: string[];
  /** How it works, step by step or as short facts. */
  howItWorks?: string[];
  /** Real company example. */
  example?: string;
  mistakes?: string[];
  /** What AZ-104 tends to test and the traps around it. */
  examTips?: string[];
  /** Optional visual shown on the concept page. */
  visual?: Extract<Block, { type: 'flow' | 'diagram' | 'interactive' }>;
  /** Breadcrumb of concept ids showing where it lives in Azure. */
  place?: string[];
  sources?: string[];
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type QuestionKind =
  | 'knowledge'
  | 'discrimination'
  | 'configuration'
  | 'scenario'
  | 'troubleshooting'
  | 'architecture'
  | 'first-step'
  | 'multi-step';

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  knowledge: 'Knowledge',
  discrimination: 'Concept discrimination',
  configuration: 'Configuration',
  scenario: 'Scenario',
  troubleshooting: 'Troubleshooting',
  architecture: 'Architecture',
  'first-step': 'What should you do first?',
  'multi-step': 'Multi-step',
};

export interface QuestionExplanation {
  /** Why the correct answer is correct. */
  correct: string;
  conceptTested: string;
  realWorld: string;
  trap?: string;
}

export interface Exhibit {
  title: string;
  kind: 'table' | 'code' | 'text';
  columns?: string[];
  rows?: string[][];
  code?: string;
  lang?: CodeLang;
  text?: string;
}

interface QuestionBase {
  id: string;
  domain: DomainId;
  skills: string[];
  concepts: string[];
  kind: QuestionKind;
  difficulty: 1 | 2 | 3;
  stem: string;
  exhibit?: Exhibit;
  explanation: QuestionExplanation;
  sources: string[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  correct?: boolean;
  why: string;
}

export interface SingleQuestion extends QuestionBase {
  format: 'single';
  options: ChoiceOption[];
}

export interface MultiQuestion extends QuestionBase {
  format: 'multi';
  /** e.g. "Select two." — number of correct options is enforced by tests. */
  options: ChoiceOption[];
}

export interface YesNoQuestion extends QuestionBase {
  format: 'yesno';
  statements: { id: string; text: string; answer: boolean; why: string }[];
}

export interface OrderQuestion extends QuestionBase {
  format: 'order';
  /** Items listed in the CORRECT order. The UI shuffles them. */
  items: { id: string; text: string }[];
  why: string;
}

export interface MatchQuestion extends QuestionBase {
  format: 'match';
  prompts: { id: string; text: string; answer: string; why: string }[];
  choices: { id: string; text: string }[];
}

export type Question = SingleQuestion | MultiQuestion | YesNoQuestion | OrderQuestion | MatchQuestion;

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
  domain: DomainId | 'foundations';
  tier: ExamTier;
}

// ---------------------------------------------------------------------------
// Labs
// ---------------------------------------------------------------------------

export interface LabTask {
  id: string;
  title: string;
  goal: string;
  steps: { text: string; code?: CodeTab[] }[];
  verify: { text: string; code?: CodeTab[]; expect?: string };
  why?: string;
  hint?: string;
}

export interface Lab {
  id: string;
  number: number;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  estimatedCost: string;
  prerequisites: string[];
  objectives: string[];
  skills: string[];
  concepts: string[];
  buildsOn?: string[];
  tasks: LabTask[];
  cleanup: { text: string; code?: CodeTab[] };
  sources: string[];
}

// ---------------------------------------------------------------------------
// Troubleshooting simulations
// ---------------------------------------------------------------------------

export type ToolOutput =
  | { kind: 'table'; columns: string[]; rows: string[][]; highlight?: number[]; note?: string }
  | { kind: 'lines'; lines: string[]; note?: string }
  | { kind: 'kv'; items: { k: string; v: string; tone?: 'good' | 'bad' | 'warn' }[]; note?: string };

export interface TroubleTool {
  id: string;
  label: string;
  group: 'Configuration' | 'Network Watcher' | 'Monitoring' | 'Client';
  description: string;
  output: ToolOutput;
  /** Whether this tool reveals the key clue. Used for scoring efficiency. */
  clue?: boolean;
}

export interface TroubleScenario {
  id: string;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3;
  area: DomainId;
  ticket: { from: string; message: string };
  environment: DiagramSpec;
  tools: TroubleTool[];
  causes: { id: string; text: string; correct?: boolean; feedback: string }[];
  fixes: { id: string; text: string; correct?: boolean; feedback: string }[];
  explanation: string;
  prevention: string[];
  concepts: string[];
  sources: string[];
}

// ---------------------------------------------------------------------------
// Diagrams (generic nested-group renderer)
// ---------------------------------------------------------------------------

export type IconKey =
  | 'tenant'
  | 'management-group'
  | 'subscription'
  | 'resource-group'
  | 'user'
  | 'users'
  | 'group'
  | 'identity'
  | 'role'
  | 'policy'
  | 'lock'
  | 'tag'
  | 'cost'
  | 'vm'
  | 'vmss'
  | 'app-service'
  | 'container'
  | 'container-apps'
  | 'registry'
  | 'function'
  | 'storage'
  | 'blob'
  | 'files'
  | 'queue'
  | 'table'
  | 'disk'
  | 'database'
  | 'vnet'
  | 'subnet'
  | 'nsg'
  | 'firewall'
  | 'route'
  | 'lb'
  | 'app-gateway'
  | 'public-ip'
  | 'nic'
  | 'dns'
  | 'private-endpoint'
  | 'bastion'
  | 'gateway'
  | 'peering'
  | 'nat'
  | 'internet'
  | 'onprem'
  | 'monitor'
  | 'log-analytics'
  | 'alert'
  | 'backup'
  | 'recovery'
  | 'key-vault'
  | 'code'
  | 'region'
  | 'zone'
  | 'globe'
  | 'shield'
  | 'server'
  | 'laptop'
  | 'cloud';

export interface DiagramNode {
  type: 'node';
  id: string;
  label: string;
  sub?: string;
  icon: IconKey;
  tone?: 'default' | 'muted' | 'good' | 'bad' | 'warn' | 'accent';
  concept?: string;
  detail?: string;
}

export interface DiagramGroup {
  type: 'group';
  id: string;
  label: string;
  sub?: string;
  kind: 'region' | 'zone' | 'vnet' | 'subnet' | 'rg' | 'subscription' | 'boundary' | 'onprem' | 'plain' | 'hierarchy';
  direction?: 'row' | 'col';
  concept?: string;
  detail?: string;
  children: (DiagramNode | DiagramGroup)[];
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
  tone?: 'default' | 'allow' | 'deny' | 'data' | 'muted';
  both?: boolean;
}

export interface DiagramFlow {
  id: string;
  label: string;
  path: string[];
  tone?: 'data' | 'allow' | 'deny';
  description?: string;
}

export interface DiagramSpec {
  root: DiagramGroup;
  edges: DiagramEdge[];
  flows?: DiagramFlow[];
}

// ---------------------------------------------------------------------------
// Design lab & architecture library
// ---------------------------------------------------------------------------

export interface DesignDecision {
  id: string;
  lens: AdminQuestionId;
  question: string;
  context?: string;
  options: { id: string; label: string; detail?: string; score: 0 | 1 | 2; feedback: string }[];
  requirementIds: string[];
}

export interface DesignChallenge {
  id: string;
  title: string;
  company: string;
  brief: string;
  difficulty: 1 | 2 | 3;
  domains: DomainId[];
  requirements: { id: string; text: string; category: AdminQuestionId }[];
  constraints: string[];
  decisions: DesignDecision[];
  solution: {
    summary: string;
    diagram: DiagramSpec;
    rationale: { decision: string; why: string }[];
    alternatives: { option: string; whenBetter: string }[];
  };
  concepts: string[];
  sources: string[];
}

export interface Architecture {
  id: string;
  title: string;
  subtitle: string;
  scenario: string;
  requirements: string[];
  diagram: DiagramSpec;
  services: { concept: string; role: string; why: string }[];
  aspects: {
    security: string[];
    networking: string[];
    monitoring: string[];
    governance: string[];
    availability: string[];
    cost: string[];
  };
  alternatives: { option: string; tradeoff: string }[];
  concepts: string[];
  sources: string[];
}
