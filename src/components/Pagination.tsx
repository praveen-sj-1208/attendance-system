import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

export function usePagination<T>(items: T[] | undefined, pageSize: number = 10) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil((items?.length ?? 0) / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = React.useMemo(() => {
    if (!items) return [];
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  // Reset to page 1 when items change significantly
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  return {
    paginatedItems,
    currentPage: safeCurrentPage,
    totalPages,
    setCurrentPage,
  };
}
