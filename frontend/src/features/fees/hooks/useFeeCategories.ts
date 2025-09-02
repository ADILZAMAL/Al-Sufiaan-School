import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FeeCategory, 
  FeeCategoryFormData, 
  FeeCategoryFilters,
  ReorderRequest 
} from '../types';
import { feeCategoryApi } from '../api/feeCategory';

// Query keys
export const FEE_CATEGORY_KEYS = {
  all: ['feeCategories'] as const,
  lists: () => [...FEE_CATEGORY_KEYS.all, 'list'] as const,
  list: (filters?: FeeCategoryFilters) => [...FEE_CATEGORY_KEYS.lists(), filters] as const,
  details: () => [...FEE_CATEGORY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...FEE_CATEGORY_KEYS.details(), id] as const,
  byType: (type: string) => [...FEE_CATEGORY_KEYS.all, 'type', type] as const,
};

// Hook to get all fee categories
export const useFeeCategories = (filters?: FeeCategoryFilters) => {
  return useQuery({
    queryKey: FEE_CATEGORY_KEYS.list(filters),
    queryFn: () => feeCategoryApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get fee category by ID
export const useFeeCategory = (id: number) => {
  return useQuery({
    queryKey: FEE_CATEGORY_KEYS.detail(id),
    queryFn: () => feeCategoryApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Hook to get fee categories by type
export const useFeeCategoriesByType = (type: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly') => {
  return useQuery({
    queryKey: FEE_CATEGORY_KEYS.byType(type),
    queryFn: () => feeCategoryApi.getByType(type),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Hook to create fee category
export const useCreateFeeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeCategoryFormData) => feeCategoryApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch fee categories
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.all);
    },
    onError: (error: Error) => {
      console.error('Error creating fee category:', error);
    },
  });
};

// Hook to update fee category
export const useUpdateFeeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeeCategoryFormData> }) =>
      feeCategoryApi.update(id, data),
    onSuccess: (updatedCategory) => {
      // Update the specific category in cache
      queryClient.setQueryData(
        FEE_CATEGORY_KEYS.detail(updatedCategory.id),
        updatedCategory
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.lists());
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.byType(updatedCategory.feeType));
    },
    onError: (error: Error) => {
      console.error('Error updating fee category:', error);
    },
  });
};

// Hook to delete fee category
export const useDeleteFeeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => feeCategoryApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries(FEE_CATEGORY_KEYS.detail(deletedId));
      
      // Invalidate lists
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.lists());
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.all);
    },
    onError: (error: Error) => {
      console.error('Error deleting fee category:', error);
    },
  });
};

// Hook to reorder fee categories
export const useReorderFeeCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderRequest) => feeCategoryApi.reorder(data),
    onSuccess: () => {
      // Invalidate all fee category queries to refetch with new order
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.all);
    },
    onError: (error: Error) => {
      console.error('Error reordering fee categories:', error);
    },
  });
};

// Hook to toggle active status
export const useToggleFeeCategoryActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      feeCategoryApi.toggleActive(id, isActive),
    onSuccess: (updatedCategory) => {
      // Update the specific category in cache
      queryClient.setQueryData(
        FEE_CATEGORY_KEYS.detail(updatedCategory.id),
        updatedCategory
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries(FEE_CATEGORY_KEYS.lists());
    },
    onError: (error: Error) => {
      console.error('Error toggling fee category status:', error);
    },
  });
};

// Optimistic update hook for better UX
export const useOptimisticFeeCategories = (filters?: FeeCategoryFilters) => {
  const queryClient = useQueryClient();
  const { data: feeCategories, ...queryResult } = useFeeCategories(filters);

  const optimisticUpdate = (id: number, updates: Partial<FeeCategory>) => {
    queryClient.setQueryData(
      FEE_CATEGORY_KEYS.list(filters),
      (oldData: FeeCategory[] | undefined): FeeCategory[] => {
        if (!oldData) return [];
        return oldData.map(category =>
          category.id === id ? { ...category, ...updates } : category
        );
      }
    );
  };

  const optimisticDelete = (id: number) => {
    queryClient.setQueryData(
      FEE_CATEGORY_KEYS.list(filters),
      (oldData: FeeCategory[] | undefined): FeeCategory[] => {
        if (!oldData) return [];
        return oldData.filter(category => category.id !== id);
      }
    );
  };

  const optimisticAdd = (newCategory: FeeCategory) => {
    queryClient.setQueryData(
      FEE_CATEGORY_KEYS.list(filters),
      (oldData: FeeCategory[] | undefined): FeeCategory[] => {
        if (!oldData) return [newCategory];
        return [...oldData, newCategory];
      }
    );
  };

  return {
    feeCategories,
    optimisticUpdate,
    optimisticDelete,
    optimisticAdd,
    ...queryResult,
  };
};
