import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { SchoolMapData } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Users, GraduationCap, UserCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InspectorMapData {
  schools: SchoolMapData[];
  filter_options: {
    types: string[];
    delegations: string[];
  };
  total_count: number;
  assigned_info?: string;
  assignments_count?: number;
  message?: string;
}

const InspectorMapView: React.FC = () => {
  const { t } = useLanguage();
  const [schools, setSchools] = useState<SchoolMapData[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    types: string[];
    delegations: string[];
  }>({ types: [], delegations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedInfo, setAssignedInfo] = useState<string>('');
  const [assignmentsCount, setAssignmentsCount] = useState<number>(0);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDelegation, setSelectedDelegation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected school for details panel
  const [selectedSchool, setSelectedSchool] = useState<SchoolMapData | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedType && selectedType !== 'all') params.type = selectedType;
      if (selectedDelegation && selectedDelegation !== 'all') params.delegation = selectedDelegation;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/users/inspector_map/', { params });
      const data: InspectorMapData = response.data;
      
      console.log('Inspector schools map data received:', {
        schoolsCount: data.schools.length,
        assignedInfo: data.assigned_info,
        assignmentsCount: data.assignments_count,
        filterOptions: {
          types: data.filter_options.types.length,
          delegations: data.filter_options.delegations.length
        }
      });
      
      setSchools(data.schools);
      setFilterOptions(data.filter_options);
      setAssignedInfo(data.assigned_info || '');
      setAssignmentsCount(data.assignments_count || 0);
      setError(data.message || null);
    } catch (err: any) {
      console.error('Failed to fetch inspector schools map data:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load school map data');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedDelegation, searchQuery]);

  useEffect(() => {
    // Debounce search queries to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      fetchSchools();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchSchools]);

  const handleMarkerClick = useCallback((school: SchoolMapData) => {
    setSelectedSchool(school);
  }, []);

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedDelegation('all');
    setSearchQuery('');
  };

  // Calculate map center based on schools
  const mapCenter: [number, number] = useMemo(() => {
    if (schools.length === 0) return [34.0, 9.0];
    const avgLat = schools.reduce((sum, s) => sum + s.latitude, 0) / schools.length;
    const avgLng = schools.reduce((sum, s) => sum + s.longitude, 0) / schools.length;
    return [avgLat, avgLng];
  }, [schools]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            {assignedInfo && (
              <div className="mt-2 text-sm">
                <Badge variant="outline" className="mb-2">{assignmentsCount} Assignment{assignmentsCount !== 1 ? 's' : ''}</Badge>
                <p className="text-xs text-muted-foreground">{assignedInfo}</p>
              </div>
            )}
            <div className="mt-2 font-medium">{schools.length} schools displayed</div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* School Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">School Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delegation Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Delegation</label>
            <Select value={selectedDelegation} onValueChange={setSelectedDelegation}>
              <SelectTrigger>
                <SelectValue placeholder="All Delegations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delegations</SelectItem>
                {filterOptions.delegations.map((delegation) => (
                  <SelectItem key={delegation} value={delegation}>
                    {delegation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>

          {/* Selected School Details */}
          {selectedSchool && (
            <div className="mt-6 pt-6 border-t space-y-3">
              <h3 className="font-semibold text-sm">Selected School</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm">{selectedSchool.name}</p>
                  {selectedSchool.name_ar && (
                    <p className="text-xs text-muted-foreground">{selectedSchool.name_ar}</p>
                  )}
                </div>
                <Badge variant="outline">{selectedSchool.school_type}</Badge>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Code:</span> {selectedSchool.school_code}</p>
                  <p><span className="font-medium">Delegation:</span> {selectedSchool.delegation}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.total_users} total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.teachers} teachers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.students} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.advisors} advisors</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Panel */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>Schools Map - My Assignments</CardTitle>
          </div>
          <CardDescription>
            {assignedInfo || 'View all schools in your assigned regions/subjects'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && assignmentsCount === 0 ? (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">No Assignments Configured</p>
                  <p className="text-sm">{error}</p>
                </div>
              </AlertDescription>
            </Alert>
          ) : error && !assignedInfo ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {(!error || assignmentsCount > 0) && (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              )}
              {schools.length === 0 && !loading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    {error || 'No schools found matching your assignments'}
                  </p>
                </div>
              )}
              <MapContainer
                center={mapCenter}
                zoom={schools.length > 0 ? 10 : 7}
                style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
                className="z-0"
                preferCanvas={true}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={60}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick={true}
                  disableClusteringAtZoom={12}
                  animate={true}
                  animateAddingMarkers={false}
                  removeOutsideVisibleBounds={true}
                >
                  {schools.map((school) => (
                    <Marker
                      key={school.id}
                      position={[school.latitude, school.longitude]}
                      eventHandlers={{
                        click: () => handleMarkerClick(school),
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-semibold text-sm mb-1">{school.name}</h3>
                          {school.name_ar && (
                            <p className="text-xs text-gray-600 mb-2">{school.name_ar}</p>
                          )}
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium">Type:</span> {school.school_type}</p>
                            <p><span className="font-medium">Code:</span> {school.school_code}</p>
                            <p><span className="font-medium">Delegation:</span> {school.delegation}</p>
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <span>Teachers: {school.teachers}</span>
                              <span>Students: {school.students}</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectorMapView;
