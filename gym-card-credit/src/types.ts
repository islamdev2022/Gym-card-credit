export interface User {
  _id: string
  name: string
  rfidUid: string
  credit: number
  lastScan: string
  scans?: string[]
  topUps?: { amount: number; date: string }[]
  createdAt: string
}