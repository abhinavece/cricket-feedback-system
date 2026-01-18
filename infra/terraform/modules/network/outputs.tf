# Network Module Outputs

output "vcn_id" {
  description = "VCN OCID"
  value       = oci_core_vcn.main.id
}

output "vcn_cidr" {
  description = "VCN CIDR block"
  value       = oci_core_vcn.main.cidr_blocks[0]
}

output "public_subnet_id" {
  description = "Public subnet OCID"
  value       = oci_core_subnet.public.id
}

output "private_subnet_id" {
  description = "Private subnet OCID"
  value       = oci_core_subnet.private.id
}

output "service_lb_subnet_id" {
  description = "Load balancer subnet OCID"
  value       = oci_core_subnet.service_lb.id
}

output "internet_gateway_id" {
  description = "Internet gateway OCID"
  value       = oci_core_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "NAT gateway OCID"
  value       = oci_core_nat_gateway.main.id
}

output "public_route_table_id" {
  description = "Public route table OCID"
  value       = oci_core_route_table.public.id
}

output "private_route_table_id" {
  description = "Private route table OCID"
  value       = oci_core_route_table.private.id
}

output "public_security_list_id" {
  description = "Public security list OCID"
  value       = oci_core_security_list.public.id
}

output "private_security_list_id" {
  description = "Private security list OCID"
  value       = oci_core_security_list.private.id
}
