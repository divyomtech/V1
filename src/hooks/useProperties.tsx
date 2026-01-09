import { useState, useCallback } from 'react';
import { api, Property, PropertyDetail } from '@/lib/api';

interface PropertyFilters {
    city?: string;
    gender_preference?: string;
    min_rent?: number;
    max_rent?: number;
    amenities?: string;
    sort_by?: string;
}

export const useProperties = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProperties = useCallback(async (filters?: PropertyFilters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getProperties(filters);
            setProperties(data);
            return data;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProperty = useCallback(async (id: string): Promise<PropertyDetail | null> => {
        setLoading(true);
        setError(null);
        try {
            return await api.getProperty(id);
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { properties, loading, error, fetchProperties, fetchProperty };
};
