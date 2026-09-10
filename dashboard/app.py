"""
Streamlit dashboard for the Airfare Price Index (APIx).

Provides visualizations of:
- National airfare price index trend
- Route-level breakdowns
- Airline comparisons
- Data quality and coverage statistics
- Anomaly alerts
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Any

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from sqlalchemy import select, func, and_

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.models import FareQuote
from db.session import create_database_session, get_database_url
from pipeline.index_calculator import (
    calculate_airfare_index,
    get_route_statistics,
    get_airline_statistics,
    detect_anomalies,
)


# Page configuration
st.set_page_config(
    page_title="Airfare Price Index (APIx)",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
    }
    .index-high {
        color: #d32f2f;
    }
    .index-low {
        color: #388e3c;
    }
</style>
""", unsafe_allow_html=True)


def get_db_session():
    """Get a database session."""
    return create_database_session(get_database_url())


@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_index_data():
    """Load the current airfare index."""
    session = get_db_session()
    try:
        index_data = calculate_airfare_index(session, base_period="2024-01")
        return index_data
    finally:
        session.close()


@st.cache_data(ttl=300)
def load_route_data(days: int = 30):
    """Load fare data for all routes."""
    session = get_db_session()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(
                FareQuote.origin,
                FareQuote.destination,
                FareQuote.total_fare,
                FareQuote.carrier,
                FareQuote.scrape_timestamp,
                FareQuote.advance_purchase_days,
            )
            .where(FareQuote.scrape_timestamp >= cutoff)
            .order_by(FareQuote.scrape_timestamp)
        )
        
        results = session.execute(query).all()
        df = pd.DataFrame(
            results,
            columns=["Origin", "Destination", "Fare", "Carrier", "Timestamp", "AdvanceDays"],
        )
        
        if len(df) > 0:
            df["Timestamp"] = pd.to_datetime(df["Timestamp"])
            df["Route"] = df["Origin"] + "-" + df["Destination"]
            df["Date"] = df["Timestamp"].dt.date
        
        return df
    finally:
        session.close()


@st.cache_data(ttl=300)
def load_route_stats(route: str):
    """Load statistics for a specific route."""
    session = get_db_session()
    try:
        origin, destination = route.split("-")
        stats = get_route_statistics(session, origin, destination)
        return stats
    finally:
        session.close()


@st.cache_data(ttl=300)
def load_airline_stats(carrier: str):
    """Load statistics for a specific airline."""
    session = get_db_session()
    try:
        stats = get_airline_statistics(session, carrier)
        return stats
    finally:
        session.close()


def render_header():
    """Render the dashboard header."""
    st.title("✈️ Airfare Price Index (APIx)")
    st.markdown(
        "**Real-time price index for domestic Indian flights**  \n"
        "Powered by automated web scraping of airlines & OTA portals"
    )
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Last Update", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    with col2:
        st.metric("Data Source", "Indigo, Goibibo")
    with col3:
        st.metric("Coverage Period", "Last 30 days")


def render_index_section():
    """Render the national index section."""
    st.header("📊 National Airfare Price Index")
    
    index_data = load_index_data()
    national_index = index_data.get("national_index", 100.0)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        delta = national_index - 100.0
        st.metric(
            "Current Index",
            f"{national_index:.1f}",
            delta=f"{delta:+.1f}" if delta != 0 else "Baseline",
            delta_color="inverse" if delta > 0 else "normal",
        )
    with col2:
        coverage = index_data.get("coverage_percent", 0)
        st.metric("Coverage", f"{coverage:.1f}%", help="% of routes with recent data")
    with col3:
        routes_covered = index_data.get("routes_covered", 0)
        st.metric("Routes Monitored", f"{routes_covered}/{index_data.get('total_routes_in_basket', 5)}")
    with col4:
        st.metric(
            "Base Period",
            index_data.get("base_period", "2024-01"),
            help="Reference period for index calculation"
        )
    
    # Route-level indices
    st.subheader("Route-Level Indices")
    route_indices = index_data.get("route_indices", {})
    
    if route_indices:
        # Create a bar chart
        routes = list(route_indices.keys())
        indices = list(route_indices.values())
        colors = ["#d32f2f" if idx > 105 else "#388e3c" for idx in indices]
        
        fig = go.Figure(data=[
            go.Bar(
                x=routes,
                y=indices,
                marker_color=colors,
                text=[f"{idx:.1f}" for idx in indices],
                textposition="auto",
            )
        ])
        fig.update_layout(
            title="Price Index by Route (Base=100)",
            xaxis_title="Route",
            yaxis_title="Index Value",
            height=400,
            hovermode="x unified",
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Airline-level indices
    st.subheader("Airline-Level Indices")
    airline_indices = index_data.get("airline_indices", {})
    
    if airline_indices:
        airlines = list(airline_indices.keys())
        indices = list(airline_indices.values())
        colors = ["#d32f2f" if idx > 105 else "#388e3c" for idx in indices]
        
        fig = go.Figure(data=[
            go.Bar(
                x=airlines,
                y=indices,
                marker_color=colors,
                text=[f"{idx:.1f}" for idx in indices],
                textposition="auto",
            )
        ])
        fig.update_layout(
            title="Price Index by Airline (Base=100)",
            xaxis_title="Airline",
            yaxis_title="Index Value",
            height=400,
            hovermode="x unified",
        )
        st.plotly_chart(fig, use_container_width=True)


def render_route_analysis():
    """Render route-level analysis section."""
    st.header("🗺️ Route Analysis")
    
    df = load_route_data(days=30)
    
    if df.empty:
        st.warning("No data available for the selected period.")
        return
    
    # Get unique routes
    routes = sorted(df["Route"].unique())
    selected_route = st.selectbox("Select a route", routes)
    
    if selected_route:
        route_stats = load_route_stats(selected_route)
        
        if route_stats:
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("Min Fare", f"₹{route_stats['min_fare']:.0f}")
            with col2:
                st.metric("Max Fare", f"₹{route_stats['max_fare']:.0f}")
            with col3:
                st.metric("Mean Fare", f"₹{route_stats['mean_fare']:.0f}")
            with col4:
                st.metric("Median Fare", f"₹{route_stats['median_fare']:.0f}")
            with col5:
                st.metric("Std Dev", f"₹{route_stats['std_dev']:.0f}")
            
            # Filter data for this route
            route_df = df[df["Route"] == selected_route].copy()
            
            if not route_df.empty:
                # Time series chart
                daily_avg = route_df.groupby("Date")["Fare"].mean().reset_index()
                daily_avg = daily_avg.sort_values("Date")
                
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=daily_avg["Date"],
                    y=daily_avg["Fare"],
                    mode="lines+markers",
                    name="Daily Average Fare",
                    line=dict(color="#1f77b4", width=2),
                ))
                fig.update_layout(
                    title=f"Fare Trend for {selected_route}",
                    xaxis_title="Date",
                    yaxis_title="Fare (₹)",
                    height=400,
                    hovermode="x unified",
                )
                st.plotly_chart(fig, use_container_width=True)
                
                # Airline comparison for this route
                airline_data = route_df.groupby("Carrier")["Fare"].agg(["mean", "count"]).reset_index()
                airline_data = airline_data[airline_data["count"] >= 3]  # Only airlines with 3+ quotes
                
                if not airline_data.empty:
                    st.subheader(f"Airline Fares on {selected_route}")
                    fig = px.bar(
                        airline_data,
                        x="Carrier",
                        y="mean",
                        title="Average Fare by Airline",
                        labels={"mean": "Average Fare (₹)", "Carrier": "Airline"},
                        color="mean",
                        color_continuous_scale="RdYlGn_r",
                    )
                    st.plotly_chart(fig, use_container_width=True)
                
                # Distribution chart
                fig = px.histogram(
                    route_df,
                    x="Fare",
                    nbins=20,
                    title=f"Fare Distribution on {selected_route}",
                    labels={"Fare": "Fare (₹)"},
                )
                st.plotly_chart(fig, use_container_width=True)


def render_airline_analysis():
    """Render airline-level analysis section."""
    st.header("🛫 Airline Analysis")
    
    session = get_db_session()
    try:
        # Get unique airlines
        carriers_query = select(FareQuote.carrier).distinct()
        carriers = sorted([row[0] for row in session.execute(carriers_query).all()])
    finally:
        session.close()
    
    selected_airline = st.selectbox("Select an airline", carriers)
    
    if selected_airline:
        airline_stats = load_airline_stats(selected_airline)
        
        if airline_stats:
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Mean Fare", f"₹{airline_stats['mean_fare']:.0f}")
            with col2:
                st.metric("Median Fare", f"₹{airline_stats['median_fare']:.0f}")
            with col3:
                st.metric("Routes", airline_stats['route_count'])
            with col4:
                st.metric("Quotes", airline_stats['sample_count'])
            
            # Routes operated
            st.subheader("Routes Operated")
            routes_df = pd.DataFrame({
                "Route": airline_stats.get("routes", [])
            })
            st.dataframe(routes_df, use_container_width=True, hide_index=True)


def render_data_quality():
    """Render data quality and coverage section."""
    st.header("📈 Data Quality & Coverage")
    
    df = load_route_data(days=30)
    
    if df.empty:
        st.warning("No data available.")
        return
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Quotes", len(df))
    with col2:
        st.metric("Unique Routes", df["Route"].nunique())
    with col3:
        st.metric("Unique Airlines", df["Carrier"].nunique())
    with col4:
        days_covered = (df["Timestamp"].max() - df["Timestamp"].min()).days + 1
        st.metric("Days Covered", days_covered)
    
    # Quotes per route
    st.subheader("Quote Coverage by Route")
    quotes_per_route = df.groupby("Route").size().reset_index(name="Quotes").sort_values("Quotes", ascending=False)
    
    fig = px.bar(
        quotes_per_route,
        x="Route",
        y="Quotes",
        title="Number of Quotes by Route",
        labels={"Quotes": "Number of Quotes", "Route": "Route"},
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Quotes over time
    st.subheader("Quote Collection Trend")
    quotes_per_day = df.groupby("Date").size().reset_index(name="Quotes").sort_values("Date")
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=quotes_per_day["Date"],
        y=quotes_per_day["Quotes"],
        mode="lines+markers",
        name="Quotes/Day",
        fill="tozeroy",
    ))
    fig.update_layout(
        title="Daily Quote Collection",
        xaxis_title="Date",
        yaxis_title="Number of Quotes",
        height=400,
    )
    st.plotly_chart(fig, use_container_width=True)


def render_anomalies():
    """Render anomaly detection section."""
    st.header("⚠️ Price Anomalies & Alerts")
    
    df = load_route_data(days=30)
    
    if df.empty:
        st.info("No data available for anomaly detection.")
        return
    
    routes = sorted(df["Route"].unique())
    selected_route = st.selectbox("Select route for anomaly detection", routes, key="anomaly_route")
    
    if selected_route:
        session = get_db_session()
        try:
            anomalies = detect_anomalies(session, selected_route, threshold_percent=25)
        finally:
            session.close()
        
        if anomalies:
            st.warning(f"⚠️ Found {len(anomalies)} anomalies on {selected_route}")
            
            anomaly_df = pd.DataFrame(anomalies)
            anomaly_df["Timestamp"] = pd.to_datetime(anomaly_df["Timestamp"])
            anomaly_df = anomaly_df[["Timestamp", "Fare", "Mean Fare", "Spike %"]]
            
            st.dataframe(anomaly_df, use_container_width=True, hide_index=True)
        else:
            st.success(f"✓ No significant price anomalies detected on {selected_route}")


def main():
    """Main dashboard function."""
    render_header()
    
    # Sidebar for navigation
    page = st.sidebar.radio(
        "Navigation",
        ["Dashboard", "Route Analysis", "Airline Analysis", "Data Quality", "Anomalies"],
        index=0,
    )
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### About APIx")
    st.sidebar.markdown(
        "Real-time Airfare Price Index for India, developed for the Ministry of "
        "Statistics and Programme Implementation (MoSPI) to augment the Consumer Price Index."
    )
    
    if page == "Dashboard":
        render_index_section()
    elif page == "Route Analysis":
        render_route_analysis()
    elif page == "Airline Analysis":
        render_airline_analysis()
    elif page == "Data Quality":
        render_data_quality()
    elif page == "Anomalies":
        render_anomalies()


if __name__ == "__main__":
    main()
