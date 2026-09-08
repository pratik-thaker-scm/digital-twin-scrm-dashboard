import type { Node, Edge } from 'reactflow'
import { suppliers, edges, downstreamOf } from '../../data/network'
import type { Tier } from '../../models/types'

const TIER_Y: Record<Tier, number> = { OEM: 40, 'Tier-1': 220, 'Tier-2': 420, 'Tier-3': 640 }
const X_GAP = 190

function tierList(tier: Tier) {
  return suppliers.filter((s) => s.tier === tier)
}

function orderByParent(nodes: typeof suppliers, parentOrder: string[]) {
  return [...nodes].sort((a, b) => {
    const aTarget = downstreamOf(a.id)[0]?.target ?? ''
    const bTarget = downstreamOf(b.id)[0]?.target ?? ''
    return parentOrder.indexOf(aTarget) - parentOrder.indexOf(bTarget)
  })
}

export function computeLayout(): { nodes: Node[]; edges: Edge[] } {
  const oem = tierList('OEM')
  const t1 = tierList('Tier-1')
  const t2 = orderByParent(tierList('Tier-2'), t1.map((s) => s.id))
  const t3 = orderByParent(tierList('Tier-3'), t2.map((s) => s.id))

  const place = (list: typeof suppliers, y: number): Node[] =>
    list.map((s, i) => ({
      id: s.id,
      type: 'supplier',
      position: { x: i * X_GAP - ((list.length - 1) * X_GAP) / 2, y },
      data: { supplier: s },
    }))

  const nodes: Node[] = [
    ...place(oem, TIER_Y.OEM),
    ...place(t1, TIER_Y['Tier-1']),
    ...place(t2, TIER_Y['Tier-2']),
    ...place(t3, TIER_Y['Tier-3']),
  ]

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: e.criticality === 'high',
    style: { stroke: e.criticality === 'high' ? '#9aa7b5' : '#c7d0da', strokeWidth: e.criticality === 'high' ? 1.6 : 1 },
  }))

  return { nodes, edges: rfEdges }
}
