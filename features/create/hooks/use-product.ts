"use client";
import { useState, useEffect, useMemo } from "react";
import { getProducts } from "./products";
import Fuse from "fuse.js";

type Product = {
  title: string;
  subcategory: string;
  photo: string;
};

export type FormattedProduct = {
  value: string;
  label: string;
  cat: string;
  photo: string;
};

const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const fetchedProducts = await getProducts;
      setProducts(fetchedProducts);
    };

    fetchProducts();
  }, []);

  const formattedProducts = useMemo(
    () =>
      products.map((product) => ({
        value: product.title,
        label: product.title,
        cat: product.subcategory,
        photo: product.photo,
      })),
    [products]
  );

  const fuse = useMemo(() => {
    const options = {
      keys: ["label"],
      threshold: 0.6, // Try a higher threshold like 0.6 for more matches
      distance: 100, // Increased from typical defaults
      ignoreLocation: true,
      shouldSort: true,
      minMatchCharLength: 1, // Changed from 2 to 1 to match shorter terms
    };
    return new Fuse<FormattedProduct>(formattedProducts, options);
  }, [formattedProducts]);

  const getAll = () => formattedProducts;

  const preprocessTerm = (term: string) =>
    term
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .toLowerCase()
      .trim();

  const searchSingleTerm = (term: string) => {
    const preprocessedTerm = preprocessTerm(term);
    console.log("Searching for single term:", preprocessedTerm);
    const results = fuse.search(preprocessedTerm).map((result) => result.item);
    console.log("Found results:", results.length);

    // If Fuse returns no results with a single term longer than 3 chars,
    // fallback to a more lenient includes search
    if (results.length === 0 && preprocessedTerm.length > 3) {
      console.log("Falling back to includes search");
      return formattedProducts.filter((product) => {
        const preprocessedLabel = preprocessTerm(product.label);
        return preprocessedLabel.includes(preprocessedTerm);
      });
    }

    return results;
  };

  const searchMultipleTerms = (terms: string[], originalQuery: string) => {
    const preprocessedQuery = preprocessTerm(originalQuery);
    return formattedProducts.filter((product) => {
      const preprocessedLabel = preprocessTerm(product.label);

      // Check for exact phrase match first
      if (preprocessedLabel.includes(preprocessedQuery)) {
        return true;
      }

      // If no exact match, check for all terms in any order
      return terms.every((term) => {
        const preprocessedTerm = preprocessTerm(term);
        return preprocessedLabel.includes(preprocessedTerm);
      });
    });
  };

  const searchProducts = (query: string) => {
    if (!query) return formattedProducts;

    // Add debugging
    console.log("Searching for:", query);

    const searchTerms = query.split(/\s+/).filter((term) => term.length > 0);
    console.log("Search terms:", searchTerms);

    if (searchTerms.length === 1) {
      return searchSingleTerm(searchTerms[0]);
    } else {
      const multiTermResults = searchMultipleTerms(searchTerms, query);
      console.log("Multi-term results:", multiTermResults.length);

      return multiTermResults.length > 0
        ? multiTermResults
        : searchSingleTerm(query); // Search the whole query as fallback
    }
  };

  return { getAll, setProducts, searchProducts };
};

export default useProducts;
