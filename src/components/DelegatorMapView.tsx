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

interface DelegatorMapData {
  schools: SchoolMapData[];
  filter_options: {
    types: string[];
    cres: string[];
  };
  total_count: number;
  assigned_delegation?: string;
  message?: string;
}

const DelegatorMapView: React.FC = () => {
  const { t } = useLanguage();
  const [schools, setSchools] = useState<SchoolMapData[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    types: string[];
    cres: string[];
  }>({ types: [], cres: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedDelegation, setAssignedDelegation] = useState<string>('');

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCre, setSelectedCre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected school for details panel
  const [selectedSchool, setSelectedSchool] = useState<SchoolMapData | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedType && selectedType !== 'all') params.type = selectedType;
      if (selectedCre && selectedCre !== 'all') params.cre = selectedCre;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/users/delegator_map/', { params });
      const data: DelegatorMapData = response.data;
      
      console.log('Delegator schools map data received:', {
        schoolsCount: data.schools.length,
        delegation: data.assigned_delegation,
        filterOptions: {
          types: data.filter_options.types.length,
          cres: data.filter_options.cres.length
        }
      });
      
      setSchools(data.schools);
      setFilterOptions(data.filter_options);
      setAssignedDelegation(data.assigned_delegation || '');
      setError(data.message || null);
    } catch (err: any) {
      console.error('Failed to fetch delegator schools map data:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load school map data');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCre, searchQuery]);

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
    setSelectedCre('all');
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
          <CardTitle className="text-lg">{t('delegationDash.map.filters')}</CardTitle>
          <CardDescription>
            {assignedDelegation && (
              <Badge variant="outline" className="mt-2">{assignedDelegation}</Badge>
            )}
            <div className="mt-2">{schools.length} {t('delegationDash.map.schoolsDisplayed')}</div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('delegationDash.map.searchSchools')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* School Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('delegationDash.map.schoolType')}</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder={t('delegationDash.map.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('delegationDash.map.allTypes')}</SelectItem>
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
            <label className="text-sm font-medium">{t('delegationDash.map.cre')}</label>
            <Select value={selectedCre} onValueChange={setSelectedCre}>
              <SelectTrigger>
                <SelectValue placeholder={t('delegationDash.map.allRegions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('delegationDash.map.allRegions')}</SelectItem>
                {filterOptions.cres.map((cre) => (
                  <SelectItem key={cre} value={cre}>
                    {cre}
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
            {t('delegationDash.map.resetFilters')}
          </Button>

          {/* Selected School Details */}
          {selectedSchool && (
            <div className="mt-6 pt-6 border-t space-y-3">
              <h3 className="font-semibold text-sm">{t('delegationDash.map.selectedSchool')}</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm">{selectedSchool.name}</p>
                  {selectedSchool.name_ar && (
                    <p className="text-xs text-muted-foreground">{selectedSchool.name_ar}</p>
                  )}
                </div>
                <Badge variant="outline">{selectedSchool.school_type}</Badge>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">{t('delegationDash.map.code')}:</span> {selectedSchool.school_code}</p>
                  <p><span className="font-medium">{t('delegationDash.map.cre')}:</span> {selectedSchool.cre}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.total_users} {t('delegationDash.map.total')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.teachers} {t('delegationDash.map.teachers')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.students} {t('delegationDash.map.students')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    <span className="text-xs">{selectedSchool.advisors} {t('delegationDash.map.advisors')}</span>
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
            <CardTitle>{t('delegationDash.map.title')} - {assignedDelegation || t('delegationDash.map.myRegion')}</CardTitle>
          </div>
          <CardDescription>
            {t('delegationDash.map.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !assignedDelegation ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">{t('delegationDash.map.loading')}</p>
                </div>
              )}
              {schools.length === 0 && !loading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t('delegationDash.map.noSchools')}</p>
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
                        <div className="p-2 min-w-[250px]">
                          <h3 className="font-bold text-sm mb-1">{school.name}</h3>
                          {school.name_ar && (
                            <p className="text-xs text-gray-600 mb-2">{school.name_ar}</p>
                          )}
                          <Badge className="mb-2">{school.school_type}</Badge>
                          <div className="space-y-1 text-xs mb-2">
                            <p><strong>{t('delegationDash.map.code')}:</strong> {school.school_code}</p>
                            <p><strong>{t('delegationDash.map.cre')}:</strong> {school.cre}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                            <div>
                              <p className="font-medium">{t('delegationDash.map.teachers')}</p>
                              <p className="text-lg font-bold">{school.teachers}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('delegationDash.map.students')}</p>
                              <p className="text-lg font-bold">{school.students}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('delegationDash.map.advisors')}</p>
                              <p className="text-lg font-bold">{school.advisors}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('delegationDash.map.total')}</p>
                              <p className="text-lg font-bold">{school.total_users}</p>
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

export default DelegatorMapView;
