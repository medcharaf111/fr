import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { SchoolMapData } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Users, GraduationCap, UserCheck, Shield } from 'lucide-react';
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

interface Inspector {
  id: number;
  username: string;
  name: string;
}

interface GPIMapData {
  schools: SchoolMapData[];
  filter_options: {
    types: string[];
    cres: string[];
    delegations: string[];
  };
  total_count: number;
  inspector_assignments: { [region: string]: Inspector[] };
}

const GPIMapView: React.FC = () => {
  const { t } = useLanguage();
  const [schools, setSchools] = useState<SchoolMapData[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    types: string[];
    cres: string[];
    delegations: string[];
  }>({ types: [], cres: [], delegations: [] });
  const [inspectorAssignments, setInspectorAssignments] = useState<{ [region: string]: Inspector[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCre, setSelectedCre] = useState<string>('all');
  const [selectedDelegation, setSelectedDelegation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected school for details panel
  const [selectedSchool, setSelectedSchool] = useState<SchoolMapData | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedType && selectedType !== 'all') params.type = selectedType;
      if (selectedCre && selectedCre !== 'all') params.cre = selectedCre;
      if (selectedDelegation && selectedDelegation !== 'all') params.delegation = selectedDelegation;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/users/gpi_map/', { params });
      const data: GPIMapData = response.data;
      
      console.log('GPI schools map data received:', {
        schoolsCount: data.schools.length,
        inspectorAssignments: Object.keys(data.inspector_assignments).length
      });
      
      setSchools(data.schools);
      setFilterOptions(data.filter_options);
      setInspectorAssignments(data.inspector_assignments);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch GPI schools map data:', err);
      setError(err.response?.data?.detail || 'Failed to load school map data');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCre, selectedDelegation, searchQuery]);

  useEffect(() => {
    // Debounce search queries
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
    setSelectedCre('all');
    setSelectedDelegation('all');
    setSearchQuery('');
  };

  // Calculate map center
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
          <CardTitle className="text-lg">Filters & Inspector Assignments</CardTitle>
          <CardDescription>
            <div className="mt-2">{schools.length} schools displayed</div>
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

          {/* CRE Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Region (CRE)</label>
            <Select value={selectedCre} onValueChange={setSelectedCre}>
              <SelectTrigger>
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions.cres.map((cre) => (
                  <SelectItem key={cre} value={cre}>
                    {cre}
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
              <SelectContent className="max-h-64">
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

          {/* Inspector Assignments */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Inspector Assignments
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.keys(inspectorAssignments).length === 0 ? (
                <p className="text-xs text-muted-foreground">No inspectors assigned</p>
              ) : (
                Object.entries(inspectorAssignments).map(([region, inspectors]) => (
                  <div key={region} className="text-xs">
                    <p className="font-medium text-sm">{region}</p>
                    <ul className="ml-3 space-y-1 text-muted-foreground">
                      {inspectors.map((inspector) => (
                        <li key={inspector.id}>• {inspector.name}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected School Details */}
          {selectedSchool && (
            <div className="pt-4 border-t space-y-3">
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
                  <p><span className="font-medium">Region:</span> {selectedSchool.cre}</p>
                  <p><span className="font-medium">Delegation:</span> {selectedSchool.delegation}</p>
                  {inspectorAssignments[selectedSchool.cre] && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="font-medium">Assigned Inspectors:</p>
                      <ul className="ml-3 space-y-1 text-muted-foreground">
                        {inspectorAssignments[selectedSchool.cre].map((inspector) => (
                          <li key={inspector.id}>• {inspector.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
            <CardTitle>National Schools Map</CardTitle>
          </div>
          <CardDescription>
            View all schools across Tunisia with inspector assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              )}
              <MapContainer
                center={mapCenter}
                zoom={7}
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
                            <p><span className="font-medium">Region:</span> {school.cre}</p>
                            <p><span className="font-medium">Delegation:</span> {school.delegation}</p>
                            {inspectorAssignments[school.cre] && inspectorAssignments[school.cre].length > 0 && (
                              <div className="pt-2 mt-2 border-t">
                                <p className="font-medium">Inspectors:</p>
                                <ul className="ml-2">
                                  {inspectorAssignments[school.cre].map((inspector) => (
                                    <li key={inspector.id}>• {inspector.name}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
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

export default GPIMapView;
