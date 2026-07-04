import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Destructure the exact payload sent by your distributor.service.ts
    const {
      company_id,
      arn_id,
      sub_broker_id,
      bank_name,
      account_number,
      account_holder_name,
      ifsc_code,
      upi_id,
      is_primary
    } = body;

    // Validate strictly required fields based on your SQL Schema
    if (!company_id || !bank_name || !account_number || !account_holder_name || !ifsc_code) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required database fields", 
          data: null, 
          timestamp: new Date().toISOString() 
        },
        { status: 400 }
      );
    }

    // 1. Parameterized SQL query to prevent SQL Injection
    const query = `
      INSERT INTO company_bank_accounts (
        company_id, 
        arn_id, 
        sub_broker_id, 
        bank_name, 
        account_number, 
        account_holder_name, 
        ifsc_code, 
        upi_id, 
        is_primary
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      company_id, 
      arn_id || null, 
      sub_broker_id || null, 
      bank_name, 
      account_number, 
      account_holder_name, 
      ifsc_code, 
      upi_id || null, 
      is_primary || false
    ];

    // 2. Execute the query using the pool from db.ts
    const result = await pool.query(query, values);
    const newBankAccount = result.rows[0];

    // 3. Return the exact ApiResponse format your frontend expects
    return NextResponse.json(
      { 
        success: true, 
        message: "Bank account created successfully", 
        data: newBankAccount, 
        timestamp: new Date().toISOString() 
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Database Insert Error [POST /api/banks]:", error);
    
    // Check for unique constraint violations (if you decide to add them later)
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          success: false, 
          message: "This account number already exists.", 
          data: null, 
          timestamp: new Date().toISOString() 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Internal server error while saving bank account.", 
        data: null, 
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}