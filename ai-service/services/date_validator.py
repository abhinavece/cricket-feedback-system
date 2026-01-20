"""
Date Validator Service

Validates payment dates against match dates.
Flags for review if payment date is older than match date.
"""

import logging
from datetime import datetime, date
from typing import Tuple, Optional

from dateutil import parser as date_parser

logger = logging.getLogger(__name__)


class DateValidator:
    """
    Validates payment dates against business rules.
    """
    
    @classmethod
    def parse_date(cls, date_string: str) -> Optional[date]:
        """
        Parse a date string into a date object.
        
        Args:
            date_string: Date string in various formats
            
        Returns:
            date object or None if parsing fails
        """
        if not date_string:
            return None
        
        try:
            # Handle YYYY-MM-DD format directly
            if len(date_string) == 10 and date_string[4] == "-" and date_string[7] == "-":
                return datetime.strptime(date_string, "%Y-%m-%d").date()
            
            # Use dateutil for flexible parsing
            parsed = date_parser.parse(date_string, fuzzy=True)
            return parsed.date()
            
        except Exception as e:
            logger.warning(f"Failed to parse date '{date_string}': {e}")
            return None
    
    @classmethod
    def validate_payment_date(
        cls,
        payment_date_str: str,
        match_date_str: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate that payment date is not older than match date.
        
        Rule: Payment date should be on or after the match date.
        If payment date is before match date, it might be:
        - A reused old screenshot
        - An incorrect extraction
        - A pre-payment (which might be valid but needs review)
        
        Args:
            payment_date_str: Extracted payment date string
            match_date_str: Match date string (ISO format)
            
        Returns:
            Tuple of (is_valid, review_reason)
            - is_valid: False if payment date < match date
            - review_reason: "date_mismatch" if invalid, None otherwise
        """
        # If no payment date extracted, can't validate - flag for review
        if not payment_date_str:
            return True, None  # No date to validate, let other validations handle it
        
        # If no match date provided, can't validate
        if not match_date_str:
            return True, None
        
        payment_date = cls.parse_date(payment_date_str)
        match_date = cls.parse_date(match_date_str)
        
        # If parsing fails, flag for review
        if not payment_date:
            logger.warning(f"Could not parse payment date: {payment_date_str}")
            return True, None  # Can't validate, let it through
        
        if not match_date:
            logger.warning(f"Could not parse match date: {match_date_str}")
            return True, None
        
        # Check if payment date is older than match date
        if payment_date < match_date:
            logger.warning(
                f"Payment date ({payment_date}) is older than match date ({match_date})"
            )
            return False, "date_mismatch"
        
        return True, None
    
    @classmethod
    def get_date_difference_days(
        cls,
        payment_date_str: str,
        match_date_str: str
    ) -> Optional[int]:
        """
        Get the difference in days between payment and match dates.
        
        Args:
            payment_date_str: Payment date string
            match_date_str: Match date string
            
        Returns:
            Number of days (positive if payment is after match)
            None if dates can't be parsed
        """
        payment_date = cls.parse_date(payment_date_str)
        match_date = cls.parse_date(match_date_str)
        
        if not payment_date or not match_date:
            return None
        
        return (payment_date - match_date).days
