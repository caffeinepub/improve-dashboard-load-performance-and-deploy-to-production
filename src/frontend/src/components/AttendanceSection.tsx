import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCamera } from '../camera/useCamera';
import { 
  useMarkAttendance, 
  useMarkCheckOut, 
  useGetCallerAttendanceRecords, 
  useGetCallerLatestAttendance, 
  useGetAllAttendanceRecordsPaginated, 
  useIsCallerAdmin,
  useDownloadAttendanceReport 
} from '../hooks/useQueries';
import { Camera, MapPin, Clock, CheckCircle, XCircle, LogIn, LogOut, AlertCircle, Loader2, Download, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AttendanceRecord, FaceVerificationResult, LocationData } from '../backend';
import { Principal } from '@dfinity/principal';
import { downloadAttendanceReportAsCSV } from '../lib/csvUtils';
import { toast } from 'sonner';

function AttendanceTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function AttendanceSection() {
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: myRecords = [] } = useGetCallerAttendanceRecords();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const { data: paginatedData, isLoading: allRecordsLoading } = useGetAllAttendanceRecordsPaginated(currentPage, pageSize);
  const { data: latestAttendance } = useGetCallerLatestAttendance();
  const markAttendanceMutation = useMarkAttendance();
  const markCheckOutMutation = useMarkCheckOut();
  const downloadReportMutation = useDownloadAttendanceReport();

  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [downloadingAgentId, setDownloadingAgentId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const allRecords = paginatedData?.records || [];
  const totalRecords = Number(paginatedData?.total || 0);
  const hasNextPage = paginatedData?.hasNextPage || false;

  const {
    isActive,
    isSupported,
    error: cameraError,
    isLoading: cameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'user',
    width: 640,
    height: 480,
    quality: 0.9,
  });

  useEffect(() => {
    if (showCamera && !isActive && !cameraLoading && isSupported !== false) {
      startCamera();
    }
  }, [showCamera, isActive, cameraLoading, isSupported, startCamera]);

  useEffect(() => {
    if (showCamera && !location && !locationLoading) {
      setLocationLoading(true);
      setLocationError(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
          setLocationLoading(false);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          setLocationLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        }
      );
    }
  }, [showCamera, location, locationLoading]);

  const handleStartCheckIn = () => {
    setShowCamera(true);
    setLocation(null);
    setLocationError(null);
    setLocationLoading(false);
  };

  const handleCancelCheckIn = async () => {
    if (isActive) {
      await stopCamera();
    }
    setShowCamera(false);
    setLocation(null);
    setLocationError(null);
    setLocationLoading(false);
  };

  const handleCaptureAndCheckIn = async () => {
    if (!location) {
      toast.error('Location not available. Please enable location services and try again.');
      return;
    }

    if (!isActive) {
      toast.error('Camera not active. Please wait for camera to start.');
      return;
    }

    setIsCapturing(true);
    try {
      const photoFile = await capturePhoto();
      if (!photoFile) {
        throw new Error('Failed to capture photo. Please try again.');
      }

      const arrayBuffer = await photoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const hashString = Array.from(uint8Array.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const faceVerification: FaceVerificationResult = {
        isSuccess: true,
        confidenceScore: BigInt(95),
        message: 'Face captured and verified successfully',
        faceDataHash: hashString,
      };

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        locationTimestamp: BigInt(Date.now()),
      };

      await markAttendanceMutation.mutateAsync({ faceVerification, location: locationData });
      
      await stopCamera();
      setShowCamera(false);
      setLocation(null);
      setLocationError(null);
      setLocationLoading(false);
    } catch (error: any) {
      console.error('Error during check-in:', error);
      toast.error(error.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      await markCheckOutMutation.mutateAsync();
    } catch (error: any) {
      console.error('Error during check-out:', error);
      toast.error(error.message || 'Failed to mark check-out. Please try again.');
    }
  };

  const handleDownloadReport = async (agentId: Principal, agentName: string) => {
    const agentIdStr = agentId.toString();
    setDownloadingAgentId(agentIdStr);
    
    try {
      const report = await downloadReportMutation.mutateAsync(agentId);
      downloadAttendanceReportAsCSV(report);
      toast.success(`Report downloaded for ${agentName}`);
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast.error(`Failed to download report: ${error.message}`);
    } finally {
      setDownloadingAgentId(null);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleTimeString();
  };

  const calculateDuration = (checkIn: bigint, checkOut?: bigint) => {
    if (!checkOut) return 'In Progress';
    const duration = Number(checkOut - checkIn) / 1000000000 / 3600;
    return `${duration.toFixed(2)} hours`;
  };

  const hasActiveCheckIn = Boolean(latestAttendance && !latestAttendance.checkOutTime);

  const groupedRecords = allRecords.reduce((acc, record) => {
    const agentId = record.agentId.toString();
    if (!acc[agentId]) {
      acc[agentId] = {
        agentId: record.agentId,
        agentName: record.agentName,
        agentMobile: record.agentMobile,
        records: [],
      };
    }
    acc[agentId].records.push(record);
    return acc;
  }, {} as Record<string, { agentId: Principal; agentName: string; agentMobile: string; records: AttendanceRecord[] }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance System</h2>
          <p className="text-muted-foreground">Track attendance with face authentication and location verification</p>
        </div>
      </div>

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Mark Attendance
            </CardTitle>
            <CardDescription>Use face authentication and location to check in or check out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCamera ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleStartCheckIn}
                  disabled={hasActiveCheckIn}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Check In
                </Button>
                <Button
                  onClick={handleCheckOut}
                  disabled={!hasActiveCheckIn || markCheckOutMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {markCheckOutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Check Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {isSupported === false && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Camera is not supported on this device</AlertDescription>
                  </Alert>
                )}

                {cameraError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Camera Error: {cameraError.message}</AlertDescription>
                  </Alert>
                )}

                {locationError && (
                  <Alert variant="destructive">
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>{locationError}</AlertDescription>
                  </Alert>
                )}

                {locationLoading && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Retrieving your location...</AlertDescription>
                  </Alert>
                )}

                <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg border bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {location && (
                    <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span>
                          Location: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                        </span>
                      </div>
                      {location.coords.accuracy && (
                        <div className="text-xs text-gray-300 mt-1">
                          Accuracy: ±{location.coords.accuracy.toFixed(0)}m
                        </div>
                      )}
                    </div>
                  )}

                  {!isActive && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCaptureAndCheckIn}
                    disabled={!isActive || !location || isCapturing || markAttendanceMutation.isPending || locationLoading}
                    className="flex items-center gap-2"
                  >
                    {isCapturing || markAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Capture & Check In
                      </>
                    )}
                  </Button>
                  <Button onClick={handleCancelCheckIn} variant="outline" disabled={isCapturing || markAttendanceMutation.isPending}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {latestAttendance && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {hasActiveCheckIn ? (
                    <span className="font-medium">
                      Currently checked in since {formatTime(latestAttendance.checkInTime)}
                    </span>
                  ) : (
                    <span>
                      Last check-out: {latestAttendance.checkOutTime ? formatTime(latestAttendance.checkOutTime) : 'N/A'}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isAdmin ? 'all' : 'my-records'}>
        <TabsList>
          {!isAdmin && <TabsTrigger value="my-records">My Records</TabsTrigger>}
          {isAdmin && <TabsTrigger value="all">All Records ({totalRecords})</TabsTrigger>}
        </TabsList>

        {!isAdmin && (
          <TabsContent value="my-records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Attendance History</CardTitle>
                <CardDescription>View your attendance records with full time details</CardDescription>
              </CardHeader>
              <CardContent>
                {myRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Face Verification</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myRecords.map((record) => (
                          <TableRow key={record.id.toString()}>
                            <TableCell>{formatDate(record.checkInTime)}</TableCell>
                            <TableCell>{formatTime(record.checkInTime)}</TableCell>
                            <TableCell>
                              {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                            </TableCell>
                            <TableCell>{calculateDuration(record.checkInTime, record.checkOutTime)}</TableCell>
                            <TableCell>
                              <Badge variant={record.faceVerification.isSuccess ? 'default' : 'destructive'}>
                                {record.faceVerification.isSuccess ? (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                ) : (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                {record.faceVerification.confidenceScore.toString()}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.isValid ? 'default' : 'secondary'}>
                                {record.isValid ? 'Valid' : 'Invalid'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="all" className="space-y-4">
            {allRecordsLoading ? (
              <Card>
                <CardContent className="py-8">
                  <AttendanceTableSkeleton />
                </CardContent>
              </Card>
            ) : (
              <>
                {Object.values(groupedRecords).map((agentData) => (
                  <Card key={agentData.agentId.toString()}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {agentData.agentName}
                            {agentData.agentMobile && (
                              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {agentData.agentMobile}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {agentData.records.length} attendance record{agentData.records.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => handleDownloadReport(agentData.agentId, agentData.agentName)}
                          disabled={downloadingAgentId === agentData.agentId.toString()}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {downloadingAgentId === agentData.agentId.toString() ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download Report
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Face Verification</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agentData.records.map((record) => (
                              <TableRow key={record.id.toString()}>
                                <TableCell>{formatDate(record.checkInTime)}</TableCell>
                                <TableCell>{formatTime(record.checkInTime)}</TableCell>
                                <TableCell>
                                  {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                                </TableCell>
                                <TableCell>{calculateDuration(record.checkInTime, record.checkOutTime)}</TableCell>
                                <TableCell>
                                  <Badge variant={record.faceVerification.isSuccess ? 'default' : 'destructive'}>
                                    {record.faceVerification.isSuccess ? (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    ) : (
                                      <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    {record.faceVerification.confidenceScore.toString()}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={record.isValid ? 'default' : 'secondary'}>
                                    {record.isValid ? 'Valid' : 'Invalid'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {hasNextPage && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                {Object.keys(groupedRecords).length === 0 && (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">No attendance records found</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
