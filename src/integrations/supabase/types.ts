export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_courses: {
        Row: {
          bundle_course_slugs: string[]
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          included_in_professional: boolean
          is_active: boolean
          is_bundle: boolean
          price_cents: number
          slug: string
          sort_order: number
          stripe_price_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bundle_course_slugs?: string[]
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          included_in_professional?: boolean
          is_active?: boolean
          is_bundle?: boolean
          price_cents?: number
          slug: string
          sort_order?: number
          stripe_price_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bundle_course_slugs?: string[]
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          included_in_professional?: boolean
          is_active?: boolean
          is_bundle?: boolean
          price_cents?: number
          slug?: string
          sort_order?: number
          stripe_price_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          payment_status: string
          progress_percent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_status?: string
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_status?: string
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          childminder_id: string
          children_ids: string[] | null
          created_at: string
          decline_reason: string | null
          end_time: string
          id: string
          notes: string | null
          parent_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          childminder_id: string
          children_ids?: string[] | null
          created_at?: string
          decline_reason?: string | null
          end_time: string
          id?: string
          notes?: string | null
          parent_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          childminder_id?: string
          children_ids?: string[] | null
          created_at?: string
          decline_reason?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          parent_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_url: string | null
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      childminder_profiles: {
        Row: {
          age_groups: string[] | null
          bio: string | null
          created_at: string
          days: string[] | null
          dbs_issue_date: string | null
          dbs_number: string | null
          experience_years: number | null
          first_aid_expiry: string | null
          hours: string | null
          id: string
          insurance_expiry: string | null
          insurance_provider: string | null
          is_available: boolean | null
          is_live: boolean | null
          languages: string[] | null
          max_children: number | null
          max_distance_miles: number | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relation: string | null
          ofsted_last_inspection: string | null
          ofsted_rating: string | null
          ofsted_urn: string | null
          onboarding_status: string
          postcode_district: string | null
          prospect_stage: string | null
          regulator: string | null
          town: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_groups?: string[] | null
          bio?: string | null
          created_at?: string
          days?: string[] | null
          dbs_issue_date?: string | null
          dbs_number?: string | null
          experience_years?: number | null
          first_aid_expiry?: string | null
          hours?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          is_available?: boolean | null
          is_live?: boolean | null
          languages?: string[] | null
          max_children?: number | null
          max_distance_miles?: number | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          ofsted_last_inspection?: string | null
          ofsted_rating?: string | null
          ofsted_urn?: string | null
          onboarding_status?: string
          postcode_district?: string | null
          prospect_stage?: string | null
          regulator?: string | null
          town?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_groups?: string[] | null
          bio?: string | null
          created_at?: string
          days?: string[] | null
          dbs_issue_date?: string | null
          dbs_number?: string | null
          experience_years?: number | null
          first_aid_expiry?: string | null
          hours?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          is_available?: boolean | null
          is_live?: boolean | null
          languages?: string[] | null
          max_children?: number | null
          max_distance_miles?: number | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          ofsted_last_inspection?: string | null
          ofsted_rating?: string | null
          ofsted_urn?: string | null
          onboarding_status?: string
          postcode_district?: string | null
          prospect_stage?: string | null
          regulator?: string | null
          town?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      childminders: {
        Row: {
          age_groups: string[]
          bio: string | null
          created_at: string
          days: string[]
          experience_years: number | null
          first_name: string
          hours: string | null
          id: string
          languages: string[]
          last_initial: string
          postcode_district: string
          town: string
          updated_at: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified: boolean
        }
        Insert: {
          age_groups?: string[]
          bio?: string | null
          created_at?: string
          days?: string[]
          experience_years?: number | null
          first_name: string
          hours?: string | null
          id: string
          languages?: string[]
          last_initial: string
          postcode_district: string
          town: string
          updated_at?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified?: boolean
        }
        Update: {
          age_groups?: string[]
          bio?: string | null
          created_at?: string
          days?: string[]
          experience_years?: number | null
          first_name?: string
          hours?: string | null
          id?: string
          languages?: string[]
          last_initial?: string
          postcode_district?: string
          town?: string
          updated_at?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified?: boolean
        }
        Relationships: []
      }
      children: {
        Row: {
          allergies: string | null
          created_at: string
          date_of_birth: string
          dietary_requirements: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          health_issues: string | null
          id: string
          last_name: string
          parent_id: string
          special_needs: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          created_at?: string
          date_of_birth: string
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          health_issues?: string | null
          id?: string
          last_name: string
          parent_id: string
          special_needs?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          created_at?: string
          date_of_birth?: string
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          health_issues?: string | null
          id?: string
          last_name?: string
          parent_id?: string
          special_needs?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string | null
          expires_at: string | null
          id: string
          review_notes: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          agency_signature_data: string | null
          agency_signature_type: string | null
          assigned_to: string | null
          child_dob: string | null
          child_name: string | null
          childminder_name: string | null
          clauses_snapshot: Json | null
          contract_type: string
          created_at: string
          created_by: string
          employer_name: string | null
          expires_at: string | null
          funding_ref: string | null
          hours_per_week: string | null
          id: string
          local_authority: string | null
          notes: string | null
          ofsted_urn: string | null
          parent_address: string | null
          parent_eligibility_code: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_postcode: string | null
          parent_signature_data: string | null
          parent_signature_type: string | null
          payment_source: string | null
          rate_per_hour: string | null
          signed_at: string | null
          signed_by_agency: boolean | null
          signed_by_agency_at: string | null
          signed_by_parent: boolean | null
          signed_by_parent_at: string | null
          start_date: string | null
          status: string
          template_version: number
          updated_at: string
        }
        Insert: {
          agency_signature_data?: string | null
          agency_signature_type?: string | null
          assigned_to?: string | null
          child_dob?: string | null
          child_name?: string | null
          childminder_name?: string | null
          clauses_snapshot?: Json | null
          contract_type: string
          created_at?: string
          created_by: string
          employer_name?: string | null
          expires_at?: string | null
          funding_ref?: string | null
          hours_per_week?: string | null
          id?: string
          local_authority?: string | null
          notes?: string | null
          ofsted_urn?: string | null
          parent_address?: string | null
          parent_eligibility_code?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_postcode?: string | null
          parent_signature_data?: string | null
          parent_signature_type?: string | null
          payment_source?: string | null
          rate_per_hour?: string | null
          signed_at?: string | null
          signed_by_agency?: boolean | null
          signed_by_agency_at?: string | null
          signed_by_parent?: boolean | null
          signed_by_parent_at?: string | null
          start_date?: string | null
          status?: string
          template_version?: number
          updated_at?: string
        }
        Update: {
          agency_signature_data?: string | null
          agency_signature_type?: string | null
          assigned_to?: string | null
          child_dob?: string | null
          child_name?: string | null
          childminder_name?: string | null
          clauses_snapshot?: Json | null
          contract_type?: string
          created_at?: string
          created_by?: string
          employer_name?: string | null
          expires_at?: string | null
          funding_ref?: string | null
          hours_per_week?: string | null
          id?: string
          local_authority?: string | null
          notes?: string | null
          ofsted_urn?: string | null
          parent_address?: string | null
          parent_eligibility_code?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_postcode?: string | null
          parent_signature_data?: string | null
          parent_signature_type?: string | null
          payment_source?: string | null
          rate_per_hour?: string | null
          signed_at?: string | null
          signed_by_agency?: boolean | null
          signed_by_agency_at?: string | null
          signed_by_parent?: boolean | null
          signed_by_parent_at?: string | null
          start_date?: string | null
          status?: string
          template_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      cpd_records: {
        Row: {
          category: string
          certificate_url: string | null
          completed_date: string
          created_at: string
          hours: number
          id: string
          notes: string | null
          provider: string | null
          title: string
          training_booking_id: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          category?: string
          certificate_url?: string | null
          completed_date: string
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          provider?: string | null
          title: string
          training_booking_id?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          category?: string
          certificate_url?: string | null
          completed_date?: string
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          provider?: string | null
          title?: string
          training_booking_id?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cpd_records_training_booking_id_fkey"
            columns: ["training_booking_id"]
            isOneToOne: false
            referencedRelation: "training_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_minder_links: {
        Row: {
          created_at: string
          employee_email: string | null
          employee_name: string | null
          employer_id: string
          ended_on: string | null
          funding_note: string | null
          id: string
          minder_user_id: string
          monthly_hour_cap: number | null
          started_on: string | null
          status: Database["public"]["Enums"]["employer_link_status"]
          subsidy_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_email?: string | null
          employee_name?: string | null
          employer_id: string
          ended_on?: string | null
          funding_note?: string | null
          id?: string
          minder_user_id: string
          monthly_hour_cap?: number | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["employer_link_status"]
          subsidy_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_email?: string | null
          employee_name?: string | null
          employer_id?: string
          ended_on?: string | null
          funding_note?: string | null
          id?: string
          minder_user_id?: string
          monthly_hour_cap?: number | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["employer_link_status"]
          subsidy_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_minder_links_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_organisations: {
        Row: {
          active: boolean
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          contact_email: string
          contact_person: string | null
          contact_phone: string | null
          country: string
          created_at: string
          id: string
          notes: string | null
          owner_user_id: string
          postal_code: string | null
          seat_count: number
          tax_id: string | null
          tier: Database["public"]["Enums"]["employer_tier"]
          updated_at: string
          vat_id: string | null
        }
        Insert: {
          active?: boolean
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name: string
          contact_email: string
          contact_person?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id: string
          postal_code?: string | null
          seat_count?: number
          tax_id?: string | null
          tier?: Database["public"]["Enums"]["employer_tier"]
          updated_at?: string
          vat_id?: string | null
        }
        Update: {
          active?: boolean
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string
          contact_person?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id?: string
          postal_code?: string | null
          seat_count?: number
          tax_id?: string | null
          tier?: Database["public"]["Enums"]["employer_tier"]
          updated_at?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          allocated_to: string | null
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_by: string | null
          paid_to: string | null
          receipt_url: string | null
          reimbursed: boolean
          updated_at: string
        }
        Insert: {
          allocated_to?: string | null
          amount?: number
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_by?: string | null
          paid_to?: string | null
          receipt_url?: string | null
          reimbursed?: boolean
          updated_at?: string
        }
        Update: {
          allocated_to?: string | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_by?: string | null
          paid_to?: string | null
          receipt_url?: string | null
          reimbursed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      first_aid_bookings: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          id: string
          refresher_due_at: string | null
          seat_count: number
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          id?: string
          refresher_due_at?: string | null
          seat_count?: number
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          refresher_due_at?: string | null
          seat_count?: number
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "first_aid_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "first_aid_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      first_aid_sessions: {
        Row: {
          capacity: number
          city: string
          cost_per_seat_cents: number
          created_at: string
          id: string
          notes: string | null
          postal_code: string
          seat_price_cents: number
          seats_booked: number
          session_date: string
          status: string
          trainer_name: string
          updated_at: string
          venue_address: string
          venue_name: string
        }
        Insert: {
          capacity?: number
          city: string
          cost_per_seat_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          postal_code: string
          seat_price_cents?: number
          seats_booked?: number
          session_date: string
          status?: string
          trainer_name: string
          updated_at?: string
          venue_address: string
          venue_name: string
        }
        Update: {
          capacity?: number
          city?: string
          cost_per_seat_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          postal_code?: string
          seat_price_cents?: number
          seats_booked?: number
          session_date?: string
          status?: string
          trainer_name?: string
          updated_at?: string
          venue_address?: string
          venue_name?: string
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          actions_taken: string | null
          created_at: string
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          outcome: string | null
          persons_involved: string | null
          reporter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          outcome?: string | null
          persons_involved?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          outcome?: string | null
          persons_involved?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_slots: {
        Row: {
          booked_at: string | null
          booked_by: string | null
          created_at: string
          created_by: string
          end_time: string
          id: string
          meeting_link: string | null
          notes: string | null
          role_target: string
          slot_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          meeting_link?: string | null
          notes?: string | null
          role_target?: string
          slot_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          meeting_link?: string | null
          notes?: string | null
          role_target?: string
          slot_date?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          from_user_id: string | null
          id: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          paid_date: string | null
          status: string
          tax: number | null
          to_user_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          from_user_id?: string | null
          id?: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          status?: string
          tax?: number | null
          to_user_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          from_user_id?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          status?: string
          tax?: number | null
          to_user_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      jugendamt_ready_assessments: {
        Row: {
          application_pack: Json
          appointment_prep: Json
          assigned_reviewer: string | null
          bundesland: string | null
          completed_at: string | null
          created_at: string
          evidence_folder: Json
          id: string
          jugendamt_name: string | null
          minder_notes: string | null
          missing_documents: Json
          monitoring_active_until: string | null
          monitoring_tier: Database["public"]["Enums"]["jugendamt_monitoring_tier"]
          ordered_at: string
          qualifications_review: Json
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["jugendamt_ready_status"]
          training_pathway: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          application_pack?: Json
          appointment_prep?: Json
          assigned_reviewer?: string | null
          bundesland?: string | null
          completed_at?: string | null
          created_at?: string
          evidence_folder?: Json
          id?: string
          jugendamt_name?: string | null
          minder_notes?: string | null
          missing_documents?: Json
          monitoring_active_until?: string | null
          monitoring_tier?: Database["public"]["Enums"]["jugendamt_monitoring_tier"]
          ordered_at?: string
          qualifications_review?: Json
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["jugendamt_ready_status"]
          training_pathway?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          application_pack?: Json
          appointment_prep?: Json
          assigned_reviewer?: string | null
          bundesland?: string | null
          completed_at?: string | null
          created_at?: string
          evidence_folder?: Json
          id?: string
          jugendamt_name?: string | null
          minder_notes?: string | null
          missing_documents?: Json
          monitoring_active_until?: string | null
          monitoring_tier?: Database["public"]["Enums"]["jugendamt_monitoring_tier"]
          ordered_at?: string
          qualifications_review?: Json
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["jugendamt_ready_status"]
          training_pathway?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          attendee_ids: string[]
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          meeting_date: string
          meeting_link: string | null
          meeting_type: string | null
          notes: string | null
          organizer_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attendee_ids?: string[]
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          meeting_date: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          organizer_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attendee_ids?: string[]
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          organizer_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          delivered: boolean | null
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          delivered?: boolean | null
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          delivered?: boolean | null
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      minder_verification: {
        Row: {
          address_checked: boolean
          basic_profile_completed: boolean
          code_of_conduct_signed_at: string | null
          cpd_recorded: boolean
          created_at: string
          email_verified: boolean
          emergency_training_completed_at: string | null
          experience_declared: boolean
          first_aid_certificate_date: string | null
          first_aid_expiry: string | null
          fuehrungszeugnis_checked: boolean
          fuehrungszeugnis_checked_at: string | null
          fuehrungszeugnis_renewal_date: string | null
          id: string
          identity_checked: boolean
          insurance_status: string | null
          jugendamt_approval_expiry: string | null
          jugendamt_confirmation_date: string | null
          jugendamt_confirmation_ref: string | null
          jugendamt_confirmed: boolean
          jugendamt_municipality: string | null
          knowledge_assessment_passed_at: string | null
          local_qualifications_completed: boolean
          notes: string | null
          permitted_categories: string[] | null
          phone_verified: boolean
          qhb_training_documented: boolean
          references_checked: boolean
          references_count: number
          reviewer_id: string | null
          right_to_work_checked: boolean
          safeguarding_declaration_signed_at: string | null
          safeguarding_induction_completed_at: string | null
          tax_social_insurance_documented: boolean
          terms_accepted_at: string | null
          tier: Database["public"]["Enums"]["verification_tier"]
          updated_at: string
          user_id: string
          verified_from: string | null
          verified_until: string | null
          video_interview_completed_at: string | null
        }
        Insert: {
          address_checked?: boolean
          basic_profile_completed?: boolean
          code_of_conduct_signed_at?: string | null
          cpd_recorded?: boolean
          created_at?: string
          email_verified?: boolean
          emergency_training_completed_at?: string | null
          experience_declared?: boolean
          first_aid_certificate_date?: string | null
          first_aid_expiry?: string | null
          fuehrungszeugnis_checked?: boolean
          fuehrungszeugnis_checked_at?: string | null
          fuehrungszeugnis_renewal_date?: string | null
          id?: string
          identity_checked?: boolean
          insurance_status?: string | null
          jugendamt_approval_expiry?: string | null
          jugendamt_confirmation_date?: string | null
          jugendamt_confirmation_ref?: string | null
          jugendamt_confirmed?: boolean
          jugendamt_municipality?: string | null
          knowledge_assessment_passed_at?: string | null
          local_qualifications_completed?: boolean
          notes?: string | null
          permitted_categories?: string[] | null
          phone_verified?: boolean
          qhb_training_documented?: boolean
          references_checked?: boolean
          references_count?: number
          reviewer_id?: string | null
          right_to_work_checked?: boolean
          safeguarding_declaration_signed_at?: string | null
          safeguarding_induction_completed_at?: string | null
          tax_social_insurance_documented?: boolean
          terms_accepted_at?: string | null
          tier?: Database["public"]["Enums"]["verification_tier"]
          updated_at?: string
          user_id: string
          verified_from?: string | null
          verified_until?: string | null
          video_interview_completed_at?: string | null
        }
        Update: {
          address_checked?: boolean
          basic_profile_completed?: boolean
          code_of_conduct_signed_at?: string | null
          cpd_recorded?: boolean
          created_at?: string
          email_verified?: boolean
          emergency_training_completed_at?: string | null
          experience_declared?: boolean
          first_aid_certificate_date?: string | null
          first_aid_expiry?: string | null
          fuehrungszeugnis_checked?: boolean
          fuehrungszeugnis_checked_at?: string | null
          fuehrungszeugnis_renewal_date?: string | null
          id?: string
          identity_checked?: boolean
          insurance_status?: string | null
          jugendamt_approval_expiry?: string | null
          jugendamt_confirmation_date?: string | null
          jugendamt_confirmation_ref?: string | null
          jugendamt_confirmed?: boolean
          jugendamt_municipality?: string | null
          knowledge_assessment_passed_at?: string | null
          local_qualifications_completed?: boolean
          notes?: string | null
          permitted_categories?: string[] | null
          phone_verified?: boolean
          qhb_training_documented?: boolean
          references_checked?: boolean
          references_count?: number
          reviewer_id?: string | null
          right_to_work_checked?: boolean
          safeguarding_declaration_signed_at?: string | null
          safeguarding_induction_completed_at?: string | null
          tax_social_insurance_documented?: boolean
          terms_accepted_at?: string | null
          tier?: Database["public"]["Enums"]["verification_tier"]
          updated_at?: string
          user_id?: string
          verified_from?: string | null
          verified_until?: string | null
          video_interview_completed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          task_key: string
          task_label: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_key: string
          task_label: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_key?: string
          task_label?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          ccg_details: string | null
          city: string | null
          created_at: string
          funding_type: string | null
          has_pets: boolean | null
          id: string
          local_authority: string | null
          parking_available: boolean | null
          payment_method: string | null
          pet_details: string | null
          postcode: string | null
          property_type: string | null
          sfe_reference: string | null
          special_requirements: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          ccg_details?: string | null
          city?: string | null
          created_at?: string
          funding_type?: string | null
          has_pets?: boolean | null
          id?: string
          local_authority?: string | null
          parking_available?: boolean | null
          payment_method?: string | null
          pet_details?: string | null
          postcode?: string | null
          property_type?: string | null
          sfe_reference?: string | null
          special_requirements?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          ccg_details?: string | null
          city?: string | null
          created_at?: string
          funding_type?: string | null
          has_pets?: boolean | null
          id?: string
          local_authority?: string | null
          parking_available?: boolean | null
          payment_method?: string | null
          pet_details?: string | null
          postcode?: string | null
          property_type?: string | null
          sfe_reference?: string | null
          special_requirements?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_courses: {
        Row: {
          category: string
          commission_label: string | null
          created_at: string
          description: string | null
          duration_label: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          price_from_cents: number | null
          price_label: string | null
          provider: string
          referral_token: string | null
          referral_url: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          commission_label?: string | null
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          price_from_cents?: number | null
          price_label?: string | null
          provider: string
          referral_token?: string | null
          referral_url: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          commission_label?: string | null
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          price_from_cents?: number | null
          price_label?: string | null
          provider?: string
          referral_token?: string | null
          referral_url?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          clicked_at: string
          commission_cents: number | null
          commission_status: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          partner_course_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicked_at?: string
          commission_cents?: number | null
          commission_status?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_course_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicked_at?: string
          commission_cents?: number | null
          commission_status?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_course_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_partner_course_id_fkey"
            columns: ["partner_course_id"]
            isOneToOne: false
            referencedRelation: "partner_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prospect_training: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          regulator: string
          task_key: string
          task_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          regulator?: string
          task_key: string
          task_label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          regulator?: string
          task_key?: string
          task_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saas_leads: {
        Row: {
          admin_notes: string | null
          company_name: string
          contact_name: string
          created_at: string
          current_software: string | null
          email: string
          estimated_seats: number | null
          id: string
          message: string | null
          org_type: Database["public"]["Enums"]["saas_org_type"] | null
          phone: string | null
          status: Database["public"]["Enums"]["saas_lead_status"]
          submitted_ip: string | null
          tier_interest: Database["public"]["Enums"]["saas_tier"] | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          current_software?: string | null
          email: string
          estimated_seats?: number | null
          id?: string
          message?: string | null
          org_type?: Database["public"]["Enums"]["saas_org_type"] | null
          phone?: string | null
          status?: Database["public"]["Enums"]["saas_lead_status"]
          submitted_ip?: string | null
          tier_interest?: Database["public"]["Enums"]["saas_tier"] | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          current_software?: string | null
          email?: string
          estimated_seats?: number | null
          id?: string
          message?: string | null
          org_type?: Database["public"]["Enums"]["saas_org_type"] | null
          phone?: string | null
          status?: Database["public"]["Enums"]["saas_lead_status"]
          submitted_ip?: string | null
          tier_interest?: Database["public"]["Enums"]["saas_tier"] | null
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          childminder_id: string | null
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          location_address: string | null
          location_postcode: string | null
          notes: string | null
          parent_id: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          childminder_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          location_address?: string | null
          location_postcode?: string | null
          notes?: string | null
          parent_id?: string | null
          start_time: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          childminder_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          location_address?: string | null
          location_postcode?: string | null
          notes?: string | null
          parent_id?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          price_monthly: number
          status: string
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          price_monthly?: number
          status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          price_monthly?: number
          status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          break_minutes: number | null
          childminder_id: string
          clock_in: string | null
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          shift_id: string | null
          status: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          break_minutes?: number | null
          childminder_id: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          break_minutes?: number | null
          childminder_id?: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_bookings: {
        Row: {
          booked_date: string | null
          certificate_url: string | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_status: string
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booked_date?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booked_date?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string
          certificate_issued: boolean | null
          cpd_hours: number | null
          created_at: string
          delivery_type: string
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean | null
          is_cpd: boolean | null
          location: string | null
          max_places: number | null
          price_pence: number
          provider: string | null
          stripe_price_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          certificate_issued?: boolean | null
          cpd_hours?: number | null
          created_at?: string
          delivery_type?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_cpd?: boolean | null
          location?: string | null
          max_places?: number | null
          price_pence?: number
          provider?: string | null
          stripe_price_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          certificate_issued?: boolean | null
          cpd_hours?: number | null
          created_at?: string
          delivery_type?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_cpd?: boolean | null
          location?: string | null
          max_places?: number | null
          price_pence?: number
          provider?: string | null
          stripe_price_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      childminder_public_profiles: {
        Row: {
          age_groups: string[] | null
          bio: string | null
          created_at: string | null
          days: string[] | null
          experience_years: number | null
          hours: string | null
          id: string | null
          is_available: boolean | null
          is_live: boolean | null
          languages: string[] | null
          max_children: number | null
          max_distance_miles: number | null
          ofsted_last_inspection: string | null
          ofsted_rating: string | null
          ofsted_urn: string | null
          onboarding_status: string | null
          postcode_district: string | null
          prospect_stage: string | null
          regulator: string | null
          town: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age_groups?: string[] | null
          bio?: string | null
          created_at?: string | null
          days?: string[] | null
          experience_years?: number | null
          hours?: string | null
          id?: string | null
          is_available?: boolean | null
          is_live?: boolean | null
          languages?: string[] | null
          max_children?: number | null
          max_distance_miles?: number | null
          ofsted_last_inspection?: string | null
          ofsted_rating?: string | null
          ofsted_urn?: string | null
          onboarding_status?: string | null
          postcode_district?: string | null
          prospect_stage?: string | null
          regulator?: string | null
          town?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age_groups?: string[] | null
          bio?: string | null
          created_at?: string | null
          days?: string[] | null
          experience_years?: number | null
          hours?: string | null
          id?: string | null
          is_available?: boolean | null
          is_live?: boolean | null
          languages?: string[] | null
          max_children?: number | null
          max_distance_miles?: number | null
          ofsted_last_inspection?: string | null
          ofsted_rating?: string | null
          ofsted_urn?: string | null
          onboarding_status?: string | null
          postcode_district?: string | null
          prospect_stage?: string | null
          regulator?: string | null
          town?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_profiles_display: {
        Args: never
        Returns: {
          first_name: string
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_verification_tier: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["verification_tier"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "childminder"
        | "parent"
        | "owner"
        | "employer"
      employer_link_status: "pending" | "active" | "paused" | "ended"
      employer_tier: "starter" | "growth" | "enterprise"
      jugendamt_monitoring_tier: "none" | "basic" | "pro"
      jugendamt_ready_status:
        | "ordered"
        | "in_review"
        | "action_required"
        | "ready"
        | "submitted"
        | "completed"
        | "cancelled"
      saas_lead_status: "new" | "contacted" | "qualified" | "won" | "lost"
      saas_org_type: "traeger" | "kette" | "kommune" | "sonstiges"
      saas_tier: "starter" | "growth" | "scale" | "bespoke"
      verification_tier: "registered" | "verified" | "jugendamt_approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "childminder", "parent", "owner", "employer"],
      employer_link_status: ["pending", "active", "paused", "ended"],
      employer_tier: ["starter", "growth", "enterprise"],
      jugendamt_monitoring_tier: ["none", "basic", "pro"],
      jugendamt_ready_status: [
        "ordered",
        "in_review",
        "action_required",
        "ready",
        "submitted",
        "completed",
        "cancelled",
      ],
      saas_lead_status: ["new", "contacted", "qualified", "won", "lost"],
      saas_org_type: ["traeger", "kette", "kommune", "sonstiges"],
      saas_tier: ["starter", "growth", "scale", "bespoke"],
      verification_tier: ["registered", "verified", "jugendamt_approved"],
    },
  },
} as const
