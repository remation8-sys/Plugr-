import {
  Bot,
  Database,
  GitBranch,
  Mail,
  Plus,
  Webhook,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { motion, type PanInfo } from 'motion/react';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Interactive workflow canvas for the landing hero.
 *
 * Adapted from the 21st.dev n8n-workflow community block — drag nodes to
 * reposition, add nodes to extend the flow — recolored to the Plugr/Stitch
 * blue palette and populated with real Plugr step types.
 */

type NodeType = 'trigger' | 'agent' | 'action' | 'condition';

interface WfNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  position: { x: number; y: number };
}

interface WfConnection {
  from: string;
  to: string;
}

const NODE_WIDTH = 184;
const NODE_HEIGHT = 84;

const BLUE = '#0055ff';
const GREEN = '#00c853';
const AMBER = '#ffab00';
const VIOLET = '#8b7bff';

const TEMPLATES: Omit<WfNode, 'id' | 'position'>[] = [
  {
    type: 'action',
    title: 'Send Slack message',
    subtitle: 'Notify #sales',
    icon: Mail,
    accent: BLUE,
  },
  {
    type: 'action',
    title: 'Query database',
    subtitle: 'Fetch user record',
    icon: Database,
    accent: BLUE,
  },
  {
    type: 'condition',
    title: 'Condition',
    subtitle: 'If priority = high',
    icon: GitBranch,
    accent: AMBER,
  },
  {
    type: 'action',
    title: 'Log event',
    subtitle: 'Record activity',
    icon: Zap,
    accent: VIOLET,
  },
  {
    type: 'agent',
    title: 'AI Agent',
    subtitle: 'Classify & decide',
    icon: Bot,
    accent: BLUE,
  },
];

const INITIAL_NODES: WfNode[] = [
  {
    id: 'n1',
    type: 'trigger',
    title: 'Webhook',
    subtitle: 'New lead received',
    icon: Webhook,
    accent: GREEN,
    position: { x: 150, y: 16 },
  },
  {
    id: 'n2',
    type: 'agent',
    title: 'AI Agent',
    subtitle: 'Enrich & classify',
    icon: Bot,
    accent: BLUE,
    position: { x: 40, y: 150 },
  },
  {
    id: 'n3',
    type: 'action',
    title: 'Send Slack message',
    subtitle: 'Notify #sales',
    icon: Mail,
    accent: BLUE,
    position: { x: 170, y: 286 },
  },
];

const INITIAL_CONNECTIONS: WfConnection[] = [
  { from: 'n1', to: 'n2' },
  { from: 'n2', to: 'n3' },
];

function ConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string;
  to: string;
  nodes: WfNode[];
}) {
  const a = nodes.find((n) => n.id === from);
  const b = nodes.find((n) => n.id === to);
  if (!a || !b) return null;

  const startX = a.position.x + NODE_WIDTH / 2;
  const startY = a.position.y + NODE_HEIGHT;
  const endX = b.position.x + NODE_WIDTH / 2;
  const endY = b.position.y;
  const midY = startY + (endY - startY) * 0.5;

  const path = `M${startX},${startY} C${startX},${midY} ${endX},${midY} ${endX},${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={BLUE}
      strokeWidth={1.5}
      strokeDasharray="6,6"
      strokeLinecap="round"
      opacity={0.6}
    />
  );
}

export function WorkflowCanvas() {
  const [nodes, setNodes] = useState<WfNode[]>(INITIAL_NODES);
  const [connections, setConnections] =
    useState<WfConnection[]>(INITIAL_CONNECTIONS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) dragStart.current = { ...node.position };
  };

  const handleDrag = (id: string, { offset }: PanInfo) => {
    if (draggingId !== id || !dragStart.current) return;
    const x = Math.max(0, dragStart.current.x + offset.x);
    const y = Math.max(0, dragStart.current.y + offset.y);
    flushSync(() => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)),
      );
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragStart.current = null;
  };

  const addNode = () => {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const last = nodes[nodes.length - 1];
    const position = last
      ? { x: Math.max(20, last.position.x - 40), y: last.position.y + 130 }
      : { x: 120, y: 16 };
    const newNode: WfNode = { id: `n-${Date.now()}`, ...template, position };
    flushSync(() => {
      setNodes((prev) => [...prev, newNode]);
      if (last) {
        setConnections((prev) => [...prev, { from: last.id, to: newNode.id }]);
      }
    });
  };

  return (
    <div
      className="overflow-hidden rounded-xl border shadow-2xl"
      style={{
        backgroundColor: '#0a0b14',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: GREEN }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-white/50">
            Interactive workflow preview
          </span>
        </div>
        <button
          onClick={addNode}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs text-white/70 transition-colors hover:text-white"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
          aria-label="Add example step"
        >
          <Plus className="size-3" strokeWidth={1.5} />
          Add example step
        </button>
      </div>

      {/* Canvas */}
      <div
        className="relative h-[400px] w-full overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          {connections.map((c) => (
            <ConnectionLine
              key={`${c.from}-${c.to}`}
              from={c.from}
              to={c.to}
              nodes={nodes}
            />
          ))}
        </svg>

        {nodes.map((node) => {
          const Icon = node.icon;
          const isDragging = draggingId === node.id;
          return (
            <motion.div
              key={node.id}
              drag
              dragMomentum={false}
              onDragStart={() => handleDragStart(node.id)}
              onDrag={(_, info) => handleDrag(node.id, info)}
              onDragEnd={handleDragEnd}
              style={{
                x: node.position.x,
                y: node.position.y,
                width: NODE_WIDTH,
                transformOrigin: '0 0',
              }}
              className="absolute cursor-grab active:cursor-grabbing"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              whileDrag={{ scale: 1.04, zIndex: 50 }}
            >
              <div
                className="rounded-lg border p-3 backdrop-blur"
                style={{
                  backgroundColor: 'rgba(15,17,28,0.92)',
                  borderColor: isDragging
                    ? node.accent
                    : 'rgba(255,255,255,0.12)',
                  boxShadow: isDragging
                    ? `0 0 0 1px ${node.accent}, 0 12px 30px rgba(0,0,0,0.4)`
                    : 'none',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${node.accent}1f`,
                      color: node.accent,
                    }}
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: node.accent }}
                    >
                      {node.type}
                    </div>
                    <div className="truncate text-xs font-semibold text-white">
                      {node.title}
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[11px] text-white/50">
                  {node.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4 font-mono text-[11px] text-white/50">
          <span>
            {nodes.length} {nodes.length === 1 ? 'step' : 'steps'}
          </span>
          <span>
            {connections.length}{' '}
            {connections.length === 1 ? 'connection' : 'connections'}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          Drag preview steps
        </span>
      </div>
    </div>
  );
}
