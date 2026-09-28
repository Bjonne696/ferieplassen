import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange, home = false }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination responsive-pagination" data-home={home ? "true" : undefined}>
      <button className="pagination__button responsive-pagination__button" data-home={home ? "true" : undefined} type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Forrige</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
        <button className="pagination__button responsive-pagination__button" data-home={home ? "true" : undefined} key={page} type="button" aria-current={page === currentPage ? "page" : undefined} onClick={() => onPageChange(page)}>{page}</button>)}
      <button className="pagination__button responsive-pagination__button" data-home={home ? "true" : undefined} type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Neste</button>
    </div>
  );
}