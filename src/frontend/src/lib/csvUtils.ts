import type { CsvReport } from '../backend';

export function downloadAttendanceReportAsCSV(report: CsvReport) {
  // Create CSV header
  const headers = [
    'Agent Name',
    'Agent Mobile',
    'Check-In Date',
    'Check-In Time',
    'Check-Out Date',
    'Check-Out Time',
    'Location (Lat, Long)',
    'Face Verification Status',
    'Confidence Score',
  ];

  // Create CSV rows
  const rows = report.attendanceRecords.map((record) => {
    const checkInDate = new Date(Number(record.checkInTime) / 1000000);
    const checkOutDate = record.checkOutTime > 0 
      ? new Date(Number(record.checkOutTime) / 1000000) 
      : null;

    // Parse location JSON
    let location = 'N/A';
    try {
      const locationData = JSON.parse(record.location);
      location = `${locationData.latitude}, ${locationData.longitude}`;
    } catch (e) {
      console.error('Error parsing location:', e);
    }

    // Parse face verification JSON
    let faceStatus = 'N/A';
    let confidenceScore = 'N/A';
    try {
      const faceData = JSON.parse(record.faceVerification);
      faceStatus = faceData.isSuccess ? 'Success' : 'Failed';
      confidenceScore = faceData.confidenceScore?.toString() || 'N/A';
    } catch (e) {
      console.error('Error parsing face verification:', e);
    }

    return [
      record.agentName,
      record.agentMobile || 'N/A',
      checkInDate.toLocaleDateString(),
      checkInDate.toLocaleTimeString(),
      checkOutDate ? checkOutDate.toLocaleDateString() : 'N/A',
      checkOutDate ? checkOutDate.toLocaleTimeString() : 'N/A',
      location,
      faceStatus,
      confidenceScore,
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generate filename with agent name and date
  const today = new Date().toISOString().split('T')[0];
  const filename = `${report.agentName.replace(/\s+/g, '_')}_Attendance_Report_${today}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
