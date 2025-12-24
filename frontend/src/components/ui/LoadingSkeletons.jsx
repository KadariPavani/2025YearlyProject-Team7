import { Skeleton } from "./Skeleton"

// Dashboard Skeleton - for full dashboard pages
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <Skeleton className="h-6 w-40 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <Skeleton className="h-6 w-40 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Table Skeleton - for data tables
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="bg-white rounded-lg shadow">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Card Grid Skeleton - for card-based layouts
export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6">
          <Skeleton className="h-[200px] w-full rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Profile Skeleton - for profile pages
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Form Skeleton - for forms
export function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-lg mt-8" />
        </div>
      </div>
    </div>
  )
}

// List Skeleton - for simple lists
export function ListSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Calendar Skeleton - for calendar views
export function CalendarSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  )
}

// Attendance Skeleton - for attendance views
export function AttendanceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        {[1, 2, 3, 4].map((week) => (
          <div key={week} className="grid grid-cols-7 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <Skeleton key={day} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple Loading Skeleton - for minimal loading states
export function SimpleLoadingSkeleton({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

// LoadingSkeleton - the main dashboard-style skeleton used across admin
export function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      {/* Title skeleton */}
      <Skeleton className="h-6 w-1/3 bg-gray-200 rounded-md" />

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100">
          <Skeleton className="h-6 w-12 mb-3 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-1/2 bg-gray-200 rounded" />
          <Skeleton className="h-3 w-3/4 mt-2 bg-gray-200 rounded" />
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100">
          <Skeleton className="h-6 w-12 mb-3 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-1/2 bg-gray-200 rounded" />
          <Skeleton className="h-3 w-3/4 mt-2 bg-gray-200 rounded" />
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100">
          <Skeleton className="h-6 w-12 mb-3 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-1/2 bg-gray-200 rounded" />
          <Skeleton className="h-3 w-3/4 mt-2 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
        <Skeleton className="h-4 w-1/4 mb-4 bg-gray-200 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3 bg-gray-200 rounded" />
              <Skeleton className="h-4 w-1/6 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
