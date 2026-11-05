"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Code2,
  GitBranch,
  ShieldCheck,
  FileCode2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  HardDrive,
  Workflow,
  Copy,
  Check,
} from "lucide-react";

export default function BackendArchitecturePage() {
  const [activeCodeTab, setActiveCodeTab] = useState<"fifo" | "processor" | "hierarchy">("fifo");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const codeSnippets = {
    fifo: `// src/tax-engine/tax-calculator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

export interface CapitalGainsLot {
  folioNumber: string;
  schemeCode: string;
  buyDate: Date;
  sellDate: Date;
  units: number;
  buyNav: number;
  sellNav: number;
  acquisitionCost: number;
  saleConsideration: number;
  gainAmount: number;
  isLongTerm: boolean; // >= 365 days for Equity MF (Sec 112A)
  grandfatheredCost?: number; // As per Jan 31, 2018 benchmark NAV
}

@Injectable()
export class TaxCalculatorService {
  private readonly logger = new Logger(TaxCalculatorService.name);

  /**
   * Computes Short-Term & Long-Term Capital Gains using strict FIFO
   * lot-matching as mandated by Indian Income Tax Act guidelines.
   */
  async computeFifoCapitalGains(
    investorId: string,
    financialYearStart: Date,
    financialYearEnd: Date,
  ): Promise<{ stcg: number; ltcg: number; lots: CapitalGainsLot[] }> {
    // 1. Retrieve all transactions ordered chronologically
    const transactions = await this.trxnRepo.find({
      where: { investorId },
      order: { transactionDate: 'ASC', id: 'ASC' },
    });

    const buyLots: Array<{ date: Date; units: number; nav: number; folio: string; amfi: string }> = [];
    const matchedLots: CapitalGainsLot[] = [];

    let totalStcg = 0;
    let totalLtcg = 0;

    for (const txn of transactions) {
      if (txn.type === 'PURCHASE' || txn.type === 'SIP') {
        // Enqueue acquisition lot into FIFO buffer
        buyLots.push({
          date: new Date(txn.transactionDate),
          units: Number(txn.units),
          nav: Number(txn.nav),
          folio: txn.folioNumber,
          amfi: txn.amfiCode,
        });
      } else if (txn.type === 'REDEMPTION' || txn.type === 'SWP') {
        let unitsToRedeem = Number(txn.units);
        const sellNav = Number(txn.nav);
        const sellDate = new Date(txn.transactionDate);

        // Exhaust buy lots in chronological order (FIFO)
        while (unitsToRedeem > 0 && buyLots.length > 0) {
          const earliestLot = buyLots[0];
          const matchedUnits = Math.min(unitsToRedeem, earliestLot.units);

          const buyDate = earliestLot.date;
          const holdingDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
          const isLongTerm = holdingDays >= 365;

          const acquisitionCost = matchedUnits * earliestLot.nav;
          const saleConsideration = matchedUnits * sellNav;
          const gain = saleConsideration - acquisitionCost;

          if (isLongTerm) {
            totalLtcg += gain;
          } else {
            totalStcg += gain;
          }

          matchedLots.push({
            folioNumber: txn.folioNumber,
            schemeCode: txn.amfiCode,
            buyDate,
            sellDate,
            units: matchedUnits,
            buyNav: earliestLot.nav,
            sellNav,
            acquisitionCost,
            saleConsideration,
            gainAmount: gain,
            isLongTerm,
          });

          earliestLot.units -= matchedUnits;
          unitsToRedeem -= matchedUnits;

          if (earliestLot.units <= 0.0001) {
            buyLots.shift(); // Evict exhausted lot
          }
        }
      }
    }

    return { stcg: totalStcg, ltcg: totalLtcg, lots: matchedLots };
  }
}`,
    processor: `// src/scraping/scraping.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DataSource } from 'typeorm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { parseCamsWbr9Stream } from './parsers/cams.parser';

@Processor('statement-ingestion')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly s3Client: S3Client,
  ) {}

  @Process({ name: 'process-cams-feed', concurrency: 4 })
  async handleCamsIngestion(job: Job<{ s3Key: string; tenantId: string }>) {
    this.logger.log(\`Starting statement stream processing: \${job.data.s3Key}\`);
    const { s3Key, tenantId } = job.data;

    // 1. Fetch file stream directly from encrypted AWS S3 Bucket
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_STATEMENTS_BUCKET,
        Key: s3Key,
      }),
    );

    // 2. Wrap DB operations in an atomic transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let recordCount = 0;
      const batchBuffer: any[] = [];
      const BATCH_SIZE = 500;

      // 3. Stream parse WBR9 records to prevent memory spikes
      for await (const row of parseCamsWbr9Stream(response.Body as NodeJS.ReadableStream)) {
        batchBuffer.push({
          tenantId,
          folioNumber: row.folio,
          amfiCode: row.amfiCode,
          amount: row.amount,
          nav: row.nav,
          units: row.units,
          transactionDate: row.date,
          rtaSource: 'CAMS',
        });

        if (batchBuffer.length >= BATCH_SIZE) {
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('transactions')
            .values(batchBuffer)
            .orUpdate(['amount', 'nav', 'units'], ['folio_number', 'transaction_date'])
            .execute();

          recordCount += batchBuffer.length;
          batchBuffer.length = 0;
          await job.progress(Math.min(95, Math.floor((recordCount / 5000) * 100)));
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(\`Successfully ingested \${recordCount} CAMS records into PostgreSQL.\`);
      return { success: true, processedRecords: recordCount };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(\`Failed to process statement \${s3Key}: \${err.message}\`, err.stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}`,
    hierarchy: `// src/brokerage/brokerage-hierarchy.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface BrokerCommissionNode {
  subBrokerId: string;
  name: string;
  arnId: string;
  level: number;
  sharePercentage: number;
  calculatedPayout: number;
}

@Injectable()
export class BrokerageHierarchyService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Traverses recursive sub-broker hierarchies using a PostgreSQL
   * Recursive Common Table Expression (CTE) to compute commission splits.
   */
  async calculateHierarchyCommission(
    companyId: string,
    statementPeriod: string,
  ): Promise<BrokerCommissionNode[]> {
    const query = \`
      WITH RECURSIVE SubBrokerTree AS (
        -- Anchor member: Principal Distributor (Root)
        SELECT 
          sb.id,
          sb.name,
          sb.arn_id,
          sb.parent_id,
          sb.share_percentage,
          1 AS level
        FROM sub_brokers sb
        WHERE sb.company_id = $1 AND sb.parent_id IS NULL

        UNION ALL

        -- Recursive member: Downstream sub-brokers
        SELECT 
          child.id,
          child.name,
          child.arn_id,
          child.parent_id,
          child.share_percentage,
          parent.level + 1
        FROM sub_brokers child
        INNER JOIN SubBrokerTree parent ON child.parent_id = parent.id
      )
      SELECT 
        tree.id AS "subBrokerId",
        tree.name,
        tree.arn_id AS "arnId",
        tree.level,
        tree.share_percentage AS "sharePercentage",
        COALESCE(SUM(b.gross_brokerage * (tree.share_percentage / 100.0)), 0) AS "calculatedPayout"
      FROM SubBrokerTree tree
      LEFT JOIN brokerage_records b 
        ON b.sub_broker_id = tree.id AND b.period = $2
      GROUP BY tree.id, tree.name, tree.arn_id, tree.level, tree.share_percentage
      ORDER BY tree.level ASC, tree.name ASC;
    \`;

    return this.dataSource.query(query, [companyId, statementPeriod]);
  }
}`,
  };

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg,#0a0f1d)] text-[var(--fin-heading-primary,#f8fafc)] font-sans relative overflow-x-hidden p-6 sm:p-12">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
              <Link href="/login" className="hover:text-blue-400 transition-colors">
                FinIQ Demo
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-blue-400">Technical Documentation</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Backend Architecture</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                finiq-api (NestJS)
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl leading-relaxed">
              In-depth technical overview of the production NestJS backend powering FinIQ:
              modular DDD patterns, BullMQ statement pipelines, FIFO tax calculation, and relational PostgreSQL modeling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/distributor"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-2"
            >
              <span>Distributor Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/investor"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-2"
            >
              <span>Investor Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Framework", val: "NestJS 10.x", icon: Server, color: "text-rose-400" },
            { label: "Database", val: "PostgreSQL 16", icon: Database, color: "text-blue-400" },
            { label: "ORM / Query", val: "TypeORM + Raw CTEs", icon: Layers, color: "text-orange-400" },
            { label: "Background Queue", val: "BullMQ + Redis", icon: Cpu, color: "text-red-400" },
            { label: "Object Storage", val: "AWS S3 (Encrypted)", icon: HardDrive, color: "text-yellow-400" },
            { label: "Language", val: "Strict TypeScript", icon: Code2, color: "text-teal-400" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <div className="flex items-center gap-2 mt-2">
                <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <span className="text-xs font-bold text-slate-200 truncate">{item.val}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1: System Overview (Modular Architecture) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">System Architecture & Domain Modules</h2>
              <p className="text-xs text-slate-400">Layered Domain-Driven Design (Controllers → Services → Repositories)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Auth & RBAC Module</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Implements dual JWT authentication strategies (Staff vs Investor) with Passport.js.
                Decorators enforce granular role-based access control (<code className="text-blue-400">@Roles(&apos;ADMIN&apos;, &apos;DISTRIBUTOR&apos;)</code>),
                session cookie refresh cycles, and phone OTP verification.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• JwtAuthGuard + RolesGuard</div>
                <div>• Dual Token Strategy (7d vs 30d)</div>
                <div>• Tenant Scoping Middleware</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Ingestion & Parser Module</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated background ingestion for CAMS (WBR9, WBR2) and KFintech (Karvy) statement feeds.
                Leverages BullMQ worker pools running parallel streams to parse large CSV, DBF, and text files
                with batch upserting to eliminate memory bottlenecks.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• BullMQ IngestionProcessor</div>
                <div>• Stream Processing (ReadableStream)</div>
                <div>• SHA-256 Idempotency Hashing</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Brokerage & Hierarchy Module</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports multi-tier sub-broker trees with variable contract percentages.
                Executes Recursive Common Table Expressions (CTEs) in PostgreSQL to compute upstream
                and downstream commission distributions down to individual transaction lines.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• Recursive CTE Hierarchy Traversal</div>
                <div>• Trail Brokerage Ledger Engine</div>
                <div>• Escrow Settlement Reconciliation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: PostgreSQL Database Schema (ER Diagram) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Relational Database Schema (PostgreSQL)</h2>
              <p className="text-xs text-slate-400">Entity Relationships, Foreign Key Constraints & Data Integrity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Table: Users */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
              <div className="p-3.5 bg-blue-950/60 border-b border-blue-900/40 flex items-center justify-between">
                <span className="font-bold text-blue-300">users</span>
                <span className="text-[10px] text-blue-400 font-sans font-semibold">Core Identity</span>
              </div>
              <div className="p-4 space-y-2 text-[11px]">
                <div className="flex justify-between text-yellow-400">
                  <span>id</span>
                  <span>UUID [PK]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>email</span>
                  <span>VARCHAR(255)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>phone_number</span>
                  <span>VARCHAR(20)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>role</span>
                  <span>ENUM [ROLE]</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>company_id</span>
                  <span>UUID [FK]</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>created_at</span>
                  <span>TIMESTAMPTZ</span>
                </div>
              </div>
            </div>

            {/* Table: Investors */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
              <div className="p-3.5 bg-emerald-950/60 border-b border-emerald-900/40 flex items-center justify-between">
                <span className="font-bold text-emerald-300">investors</span>
                <span className="text-[10px] text-emerald-400 font-sans font-semibold">1:1 User Extension</span>
              </div>
              <div className="p-4 space-y-2 text-[11px]">
                <div className="flex justify-between text-yellow-400">
                  <span>id</span>
                  <span>UUID [PK]</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>user_id</span>
                  <span>UUID [FK → users]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>pan</span>
                  <span>VARCHAR(10) [INDEX]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>tax_status</span>
                  <span>VARCHAR(50)</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>sub_broker_id</span>
                  <span>UUID [FK]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>total_aum</span>
                  <span>NUMERIC(15,2)</span>
                </div>
              </div>
            </div>

            {/* Table: Folios & Holdings */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
              <div className="p-3.5 bg-purple-950/60 border-b border-purple-900/40 flex items-center justify-between">
                <span className="font-bold text-purple-300">folios</span>
                <span className="text-[10px] text-purple-400 font-sans font-semibold">1:N Investor</span>
              </div>
              <div className="p-4 space-y-2 text-[11px]">
                <div className="flex justify-between text-yellow-400">
                  <span>folio_number</span>
                  <span>VARCHAR(50) [PK]</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>investor_id</span>
                  <span>UUID [FK]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>amc_name</span>
                  <span>VARCHAR(100)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>amfi_code</span>
                  <span>VARCHAR(20) [INDEX]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>registrar</span>
                  <span>ENUM(CAMS,KARVY)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>current_nav</span>
                  <span>NUMERIC(10,4)</span>
                </div>
              </div>
            </div>

            {/* Table: Brokerage Distributions */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
              <div className="p-3.5 bg-amber-950/60 border-b border-amber-900/40 flex items-center justify-between">
                <span className="font-bold text-amber-300">brokerage_data</span>
                <span className="text-[10px] text-amber-400 font-sans font-semibold">CAMS & KARVY</span>
              </div>
              <div className="p-4 space-y-2 text-[11px]">
                <div className="flex justify-between text-yellow-400">
                  <span>id</span>
                  <span>UUID [PK]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>arn_id</span>
                  <span>VARCHAR(30)</span>
                </div>
                <div className="flex justify-between text-indigo-400">
                  <span>folio_number</span>
                  <span>VARCHAR [FK]</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>gross_brokerage</span>
                  <span>NUMERIC(12,2)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>net_brokerage</span>
                  <span>NUMERIC(12,2)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>period</span>
                  <span>VARCHAR(20)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Relationship Callout Box */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              <strong className="text-slate-200">Relational Mapping:</strong> <code className="text-blue-400">User</code> (1:1) joins with <code className="text-emerald-400">Investor</code>, which has (1:N) <code className="text-purple-400">Folios</code>. Raw registrar feeds (<code className="text-amber-400">CamsBrokerageData</code> & <code className="text-amber-400">KarvyBrokerageData</code>) join on ARN and Folio numbers to automatically attribute trail commissions down to sub-broker hierarchy nodes.
            </span>
          </div>
        </section>

        {/* Section 3: Data Pipelines & Processing Flow */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Automated Statement Pipelines</h2>
              <p className="text-xs text-slate-400">End-to-end ingestion lifecycle from SFTP to S3 & Postgres</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center mb-3">
                1
              </span>
              <h3 className="font-bold text-sm text-white mb-1.5">Statement Ingestion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nightly cron jobs pull password-protected statement files (WBR9/WBR2) from CAMS/KFintech via secure SFTP. Files are validated and archived directly to AWS S3.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mb-3">
                2
              </span>
              <h3 className="font-bold text-sm text-white mb-1.5">BullMQ Job Queuing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingestion jobs are dispatched to Redis BullMQ clusters with concurrency limits. If an AMC updates thousands of folios simultaneously, workers handle backpressure smoothly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center mb-3">
                3
              </span>
              <h3 className="font-bold text-sm text-white mb-1.5">Stream Parsing & Upsert</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Custom stream parsers convert binary DBF/Excel rows into typed entities. Records are batch-upserted in chunks of 500 within database transactions to ensure zero corruption.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-3">
                4
              </span>
              <h3 className="font-bold text-sm text-white mb-1.5">FIFO Tax & Ledger Compute</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upon transaction commit, the FIFO Capital Gains engine invalidates cached portfolio valuations, recalculates XIRR, and reconciles sub-broker escrow ledger balances.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Production Code Snippets Showcase */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Production NestJS Code Snippets</h2>
                <p className="text-xs text-slate-400">Real implementations of mission-critical business logic</p>
              </div>
            </div>

            {/* Code Tabs */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveCodeTab("fifo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === "fifo"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                FIFO Tax Engine
              </button>
              <button
                onClick={() => setActiveCodeTab("processor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === "processor"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                BullMQ Parser
              </button>
              <button
                onClick={() => setActiveCodeTab("hierarchy")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === "hierarchy"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Recursive CTE Splits
              </button>
            </div>
          </div>

          {/* Stylized Code Container */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-400 font-medium">
                  {activeCodeTab === "fifo" && "src/tax-engine/tax-calculator.service.ts"}
                  {activeCodeTab === "processor" && "src/scraping/scraping.processor.ts"}
                  {activeCodeTab === "hierarchy" && "src/brokerage/brokerage-hierarchy.service.ts"}
                </span>
              </div>
              <button
                onClick={() => copyCode(codeSnippets[activeCodeTab])}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[500px] scrollbar-thin">
              <code>{codeSnippets[activeCodeTab]}</code>
            </pre>
          </div>
        </section>

        {/* Section 5: Security & Infrastructure Summary */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Production Deployment & Security Posture</h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              In production, the NestJS API operates in a multi-region Docker containerized environment.
              Database traffic routes through PgBouncer connection pooling, all client documents are encrypted
              using AWS KMS customer-managed keys, and sensitive financial computations execute within idempotent workers.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            <span>Return to Demo Showcase</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

